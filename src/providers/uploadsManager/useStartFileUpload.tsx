import axios, { AxiosError } from 'axios'
import { debounce } from 'lodash'
import { useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import * as rax from 'retry-axios'

import { absoluteRoutes } from '@/config/routes'
import { createStorageNodeUrl } from '@/utils/asset'
import { Logger } from '@/utils/logger'

import { useUploadsStore } from './store'
import { InputAssetUpload, StartFileUploadOptions, UploadStatus } from './types'

import { useSnackbar } from '../snackbars'
import { useStorageProviders } from '../storageProviders'

const RETRIES_COUNT = 3
const RETRY_DELAY = 1000
const UPLOADING_SNACKBAR_TIMEOUT = 8000
const UPLOADED_SNACKBAR_TIMEOUT = 13000

export const useStartFileUpload = () => {
  const navigate = useNavigate()
  const { displaySnackbar } = useSnackbar()
  const { getStorageProvider, markStorageProviderNotWorking } = useStorageProviders()

  const setAssetsFiles = useUploadsStore((state) => state.setAssetsFiles)
  const addAsset = useUploadsStore((state) => state.addAsset)
  const setUploadStatus = useUploadsStore((state) => state.setUploadStatus)
  const assetsFiles = useUploadsStore((state) => state.assetsFiles)

  const pendingUploadingNotificationsCounts = useRef(0)
  const assetsNotificationsCount = useRef<{
    uploads: {
      [key: string]: number
    }
    uploaded: {
      [key: string]: number
    }
  }>({
    uploads: {},
    uploaded: {},
  })

  const displayUploadingNotification = useRef(
    debounce(() => {
      displaySnackbar({
        title:
          pendingUploadingNotificationsCounts.current > 1
            ? `${pendingUploadingNotificationsCounts.current} assets being uploaded`
            : 'Asset being uploaded',
        iconType: 'info',
        timeout: UPLOADING_SNACKBAR_TIMEOUT,
        actionText: 'See',
        onActionClick: () => navigate(absoluteRoutes.studio.uploads()),
      })
      pendingUploadingNotificationsCounts.current = 0
    }, 700)
  )

  const displayUploadedNotification = useRef(
    debounce((key) => {
      const uploaded = assetsNotificationsCount.current.uploaded[key]
      const uploads = assetsNotificationsCount.current.uploads[key]

      displaySnackbar({
        customId: key,
        title: `${uploaded}/${uploads} assets uploaded`,
        iconType: 'success',
        timeout: UPLOADED_SNACKBAR_TIMEOUT,
        actionText: 'See',
        onActionClick: () => navigate(absoluteRoutes.studio.uploads()),
      })
      if (uploaded === uploads) {
        assetsNotificationsCount.current.uploaded[key] = 0
        assetsNotificationsCount.current.uploads[key] = 0
      }
    }, 700)
  )

  const startFileUpload = useCallback(
    async (file: File | Blob | null, asset: InputAssetUpload, opts?: StartFileUploadOptions) => {
      let storageUrl: string, storageProviderId: string
      try {
        const storageProvider = getStorageProvider()
        if (!storageProvider) {
          return
        }
        storageUrl = storageProvider.url
        storageProviderId = storageProvider.id
      } catch (e) {
        Logger.error('Failed to find storage provider', e)
        return
      }

      Logger.debug(`Uploading to ${storageUrl}`)

      const setAssetStatus = (status: Partial<UploadStatus>) => {
        setUploadStatus(asset.contentId, status)
      }
      const fileInState = assetsFiles?.find((file) => file.contentId === asset.contentId)
      if (!fileInState && file) {
        setAssetsFiles({ contentId: asset.contentId, blob: file })
      }

      const assetKey = `${asset.parentObject.type}-${asset.parentObject.id}`

      try {
        rax.attach()
        const assetUrl = createStorageNodeUrl(asset.contentId, storageUrl)
        if (!fileInState && !file) {
          throw Error('File was not provided nor found')
        }
        if (!opts?.isReUpload && file) {
          addAsset({ ...asset, size: file.size })
          setAssetStatus({ lastStatus: 'inProgress' })
        }
        if (opts?.isReUpload && file) {
          setAssetStatus({ lastStatus: 'inProgress' })
        }
        setAssetStatus({ progress: 0 })

        const setUploadProgress = ({ loaded, total }: ProgressEvent) => {
          setAssetStatus({ progress: (loaded / total) * 100 })
        }

        pendingUploadingNotificationsCounts.current++
        displayUploadingNotification.current()

        assetsNotificationsCount.current.uploads[assetKey] =
          (assetsNotificationsCount.current.uploads[assetKey] || 0) + 1

        await axios.put(assetUrl.toString(), opts?.changeHost ? fileInState?.blob : file, {
          headers: {
            // workaround for a bug in the storage node
            'Content-Type': '',
          },
          raxConfig: {
            retry: RETRIES_COUNT,
            noResponseRetries: RETRIES_COUNT,
            // add 400 to default list of codes to retry
            // seems storage node sometimes fails to calculate the IFPS hash correctly
            // trying again in that case should succeed
            statusCodesToRetry: [
              [100, 199],
              [400, 400],
              [429, 429],
              [500, 599],
            ],
            retryDelay: RETRY_DELAY,
            backoffType: 'static',
            onRetryAttempt: (err) => {
              const cfg = rax.getConfig(err)
              if (cfg?.currentRetryAttempt === 1) {
                setAssetStatus({ lastStatus: 'reconnecting' })
              }
            },
          },
          onUploadProgress: setUploadProgress,
        })

        // TODO: remove assets from the same parent if all finished
        setAssetStatus({ lastStatus: 'completed', progress: 100 })
        assetsNotificationsCount.current.uploaded[assetKey] =
          (assetsNotificationsCount.current.uploaded[assetKey] || 0) + 1
        displayUploadedNotification.current(assetKey)
      } catch (e) {
        Logger.error('Failed to upload to storage provider', { storageUrl, error: e })
        setAssetStatus({ lastStatus: 'error', progress: 0 })

        const axiosError = e as AxiosError
        const networkFailure =
          axiosError.isAxiosError &&
          (!axiosError.response?.status || (axiosError.response.status < 400 && axiosError.response.status >= 500))
        if (networkFailure) {
          markStorageProviderNotWorking(storageProviderId)
        }

        const snackbarDescription = networkFailure ? 'Host is not responding' : 'Unexpected error occurred'
        displaySnackbar({
          title: 'Failed to upload asset',
          description: snackbarDescription,
          actionText: 'Go to uploads',
          onActionClick: () => navigate(absoluteRoutes.studio.uploads()),
          iconType: 'warning',
        })
      }
    },
    [
      addAsset,
      assetsFiles,
      displaySnackbar,
      getStorageProvider,
      markStorageProviderNotWorking,
      navigate,
      setAssetsFiles,
      setUploadStatus,
    ]
  )

  return startFileUpload
}
