import React from 'react'

import { useUploadsManager } from '@/providers'
import { useUploadsStore } from '@/providers/uploadsManager/store'
import { AssetUploadWithProgress } from '@/providers/uploadsManager/types'

import { AssetsGroupUploadBar } from './AssetsGroupUploadBar'
import { AssetGroupUploadBarPlaceholder } from './AssetsGroupUploadBar/AssetGroupUploadBarPlaceholder'
import { EmptyUploadsView } from './EmptyUploadsView'
import { StyledText, UploadsContainer } from './MyUploadsView.style'

type GroupByParentObjectIdAcc = {
  [key: string]: AssetUploadWithProgress[]
}

export const MyUploadsView: React.FC = () => {
  const { isLoading } = useUploadsManager()
  const uploadsStatus = useUploadsStore((state) => state.uploadsStatus)
  const { channelUploadsState } = useUploadsManager()

  const filteredUploadStateWithProgress = channelUploadsState.map((asset) => ({
    ...asset,
    progress: uploadsStatus[asset.contentId]?.progress ?? 0,
    lastStatus: uploadsStatus[asset.contentId]?.lastStatus ?? asset.lastStatus,
  }))

  // Grouping all assets by parent id (videos, channel)
  const groupedUploadsState = Object.values(
    filteredUploadStateWithProgress.reduce((acc: GroupByParentObjectIdAcc, asset) => {
      if (!asset) {
        return acc
      }
      const key = asset.parentObject.id
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(asset)
      return acc
    }, {})
  )

  const hasUploads = groupedUploadsState.length > 0
  const placeholderItems = Array.from({ length: 5 }).map((_, idx) => <AssetGroupUploadBarPlaceholder key={idx} />)

  return (
    <UploadsContainer>
      <StyledText variant="h2">My uploads</StyledText>
      {isLoading ? (
        placeholderItems
      ) : hasUploads ? (
        groupedUploadsState.map((files) => <AssetsGroupUploadBar key={files[0].parentObject.id} uploadData={files} />)
      ) : (
        <EmptyUploadsView />
      )}
    </UploadsContainer>
  )
}
