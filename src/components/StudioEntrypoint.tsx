import React, { useEffect } from 'react'
import styled from '@emotion/styled'
import { Spinner, Text } from '@/shared/components'
import { TOP_NAVBAR_HEIGHT } from '@/components'
import { useMembership } from '@/api/hooks'
import { absoluteRoutes } from '@/config/routes'
import { useActiveUser, useJoystream } from '@/hooks'
import { Navigate } from 'react-router-dom'

const DEFAULT_ROUTE = absoluteRoutes.studio.videos()

export const StudioEntrypoint: React.FC = () => {
  const {
    activeUser: { accountId, memberId, channelId },
    setActiveChannel,
    loading: activeUserLoading,
  } = useActiveUser()

  const { membership, loading: membershipLoading, error: membershipError } = useMembership(
    {
      where: { id: memberId },
    },
    {
      skip: !memberId,
    }
  )

  const { extensionConnected: extensionStatus } = useJoystream()

  const extensionConnectionLoading = extensionStatus === null
  const extensionConnected = extensionStatus === true

  const accountSet = !!accountId && extensionConnected
  const memberSet = accountSet && !!memberId
  const channelSet = memberSet && !!channelId

  useEffect(() => {
    if (!membershipLoading && membership?.channels.length && memberSet && !channelSet) {
      setActiveChannel(membership.channels[0].id)
    }
  })

  if (activeUserLoading || extensionConnectionLoading) {
    return (
      <LoadingStudioContainer>
        <Text variant="h1">Loading Studio View</Text>
        <Spinner />
      </LoadingStudioContainer>
    )
  }

  if (!extensionConnected || !memberSet) {
    return <Navigate to={absoluteRoutes.studio.signIn()} />
  }

  if (channelSet) {
    return <Navigate to={DEFAULT_ROUTE} />
  }

  if (membershipLoading) {
    return (
      <LoadingStudioContainer>
        <Text variant="h1">Loading Studio View</Text>
        <Spinner />
      </LoadingStudioContainer>
    )
  }

  if (memberSet && !channelSet) {
    return <Navigate to={absoluteRoutes.studio.firstChannel()} />
  }
}

const LoadingStudioContainer = styled.main`
  position: relative;
  width: 100%;
  height: 100vh;
  padding: ${TOP_NAVBAR_HEIGHT}px var(--global-horizontal-padding) 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  div {
    margin-top: 24px;
  }
`
