import React, { useContext, useEffect, useState, useCallback } from 'react'
import { useActiveUserStore } from './store'
import { web3Accounts, web3AccountsSubscribe, web3Enable } from '@polkadot/extension-dapp'
import { AccountId } from '@/joystream-lib'
import { WEB3_APP_NAME, EXTENSION_URL } from '@/config/urls'
import { useMembership, useMemberships } from '@/api/hooks'
import { useCheckBrowser, useDialog } from '@/hooks'
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import { PolkadotExtensionRejected } from '@/components/SignInSteps/ExtensionStep'

export type Account = {
  id: AccountId
  name: string
}

type ActiveUserContextValue = ReturnType<typeof useActiveUserStore> & {
  accounts: Account[] | null
  extensionConnected: boolean | null
  extensionRejected: boolean | null

  memberships: ReturnType<typeof useMemberships>['memberships']
  membershipsLoading: boolean
  refetchMemberships: ReturnType<typeof useMemberships>['refetch']

  activeMembership: ReturnType<typeof useMembership>['membership']
  activeMembershipLoading: boolean
  refetchActiveMembership: ReturnType<typeof useMembership>['refetch']

  userInitialized: boolean
}
const ActiveUserContext = React.createContext<undefined | ActiveUserContextValue>(undefined)
ActiveUserContext.displayName = 'ActiveUserContext'

export const ActiveUserProvider: React.FC = ({ children }) => {
  const { activeUserState, setActiveUser, resetActiveUser } = useActiveUserStore()
  const [openDialog, closeDialog] = useDialog()
  const browser = useCheckBrowser()

  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [extensionConnected, setExtensionConnected] = useState<boolean | null>(null)
  const [extensionRejected, setExtensionRejected] = useState<boolean | null>(null)

  const accountsIds = (accounts || []).map((a) => a.id)
  const {
    memberships: membershipsData,
    previousData: membershipPreviousData,
    loading: membershipsLoading,
    error: membershipsError,
    refetch: refetchMemberships,
  } = useMemberships({ where: { controllerAccount_in: accountsIds } }, { skip: !accounts || !accounts.length })

  // use previous values when doing the refetch, so the app doesn't think we don't have any memberships
  const memberships = membershipsData || membershipPreviousData?.memberships

  const {
    membership: activeMembership,
    loading: activeMembershipLoading,
    error: activeMembershipError,
    refetch: refetchActiveMembership,
  } = useMembership({ where: { id: activeUserState.memberId } }, { skip: !activeUserState.memberId })

  if (membershipsError) {
    throw membershipsError
  }

  if (activeMembershipError) {
    throw activeMembershipError
  }

  const checkIfPolkadotExtensionInstalled = useCallback(async () => {
    const res = await fetch(EXTENSION_URL)
    const polkaDotExtensionInstalled = res.ok
    if (polkaDotExtensionInstalled) {
      console.warn('Polkadot extension disabled')
      openDialog({
        additionalActionsNode: <PolkadotExtensionRejected />,
        onExitClick: () => closeDialog(),
      })
      setExtensionRejected(true)
    } else {
      console.warn('No Polkadot extension detected')
    }
  }, [closeDialog, openDialog])

  // handle polkadot extension
  useEffect(() => {
    let unsub: () => void

    const initPolkadotExtension = async () => {
      try {
        const enabledExtensions = await web3Enable(WEB3_APP_NAME)

        if (!enabledExtensions.length) {
          // Current check if extension is installed in browser works only in Chromium-based browsers
          if (browser === 'chrome') {
            checkIfPolkadotExtensionInstalled()
          } else {
            console.warn('No Polkadot extension detected')
          }
          setExtensionConnected(false)
          return
        }

        const handleAccountsChange = (accounts: InjectedAccountWithMeta[]) => {
          const mappedAccounts = accounts.map((a) => ({
            id: a.address,
            name: a.meta.name || 'Unnamed',
          }))
          setAccounts(mappedAccounts)
        }

        // subscribe to changes to the accounts list
        unsub = await web3AccountsSubscribe(handleAccountsChange)
        const accounts = await web3Accounts()
        handleAccountsChange(accounts)

        setExtensionConnected(true)
      } catch (e) {
        setExtensionConnected(false)
        console.error('Unknown polkadot extension error', e)
      }
    }

    initPolkadotExtension()

    return () => {
      unsub?.()
    }
  }, [browser, checkIfPolkadotExtensionInstalled])

  useEffect(() => {
    if (!accounts || !activeUserState.accountId || extensionConnected !== true) {
      return
    }

    const account = accounts.find((a) => a.id === activeUserState.accountId)

    if (!account) {
      console.warn('Selected accountId not found in extension accounts, resetting user')
      resetActiveUser()
    }
  }, [accounts, activeUserState.accountId, extensionConnected, resetActiveUser])

  const userInitialized =
    (extensionConnected === true && (!!memberships || !accounts?.length)) || extensionConnected === false

  const contextValue: ActiveUserContextValue = {
    activeUserState,
    setActiveUser,
    resetActiveUser,

    accounts,
    extensionConnected,
    extensionRejected,

    memberships,
    membershipsLoading,
    refetchMemberships,

    activeMembership,
    activeMembershipLoading,
    refetchActiveMembership,

    userInitialized,
  }

  return <ActiveUserContext.Provider value={contextValue}>{children}</ActiveUserContext.Provider>
}

const useActiveUserContext = () => {
  const ctx = useContext(ActiveUserContext)
  if (ctx === undefined) {
    throw new Error('useMember must be used within a ActiveUserProvider')
  }
  return ctx
}

export const useUser = () => {
  const {
    activeUserState: { accountId: activeAccountId, memberId: activeMemberId, channelId: activeChannelId },
    ...rest
  } = useActiveUserContext()

  return {
    activeAccountId,
    activeMemberId,
    activeChannelId,
    ...rest,
  }
}

export const useAuthorizedUser = () => {
  const { activeAccountId, activeMemberId, activeChannelId, ...rest } = useUser()
  if (!activeAccountId || !activeMemberId || !activeChannelId) {
    throw new Error('Trying to use authorized user without authorization')
  }

  return {
    activeAccountId,
    activeMemberId,
    activeChannelId,
    ...rest,
  }
}
