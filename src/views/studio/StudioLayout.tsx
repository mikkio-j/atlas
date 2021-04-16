import React, { useState, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { useNavigate } from 'react-router-dom'
import styled from '@emotion/styled'
import { ErrorBoundary } from '@sentry/react'

import { CreateEditChannelView, MyUploadsView, MyVideosView } from '.'
import {
  JoystreamProvider,
  ActiveUserProvider,
  DraftsProvider,
  PersonalDataProvider,
  SnackbarProvider,
  useConnectionStatus,
  useActiveUser,
  useJoystream,
} from '@/hooks'
import { useMembership } from '@/api/hooks'

import { relativeRoutes, absoluteRoutes } from '@/config/routes'
import {
  ViewErrorFallback,
  StudioTopbar,
  StudioSidenav,
  NoConnectionIndicator,
  TOP_NAVBAR_HEIGHT,
  StudioEntrypoint,
  PrivateRoute,
} from '@/components'

import SignInView from './SignInView'
import CreateMemberView from './CreateMemberView'

const studioRoutes = [
  { path: relativeRoutes.studio.index(), element: <StudioEntrypoint /> },
  { path: relativeRoutes.studio.join(), element: <div>Join</div> },
  { path: relativeRoutes.studio.signIn(), element: <SignInView /> },
  { path: relativeRoutes.studio.newMembership(), element: <CreateMemberView /> },
]

const authenticatedRoutes = [
  { path: relativeRoutes.studio.newChannel(), element: <CreateEditChannelView newChannel /> },
  { path: relativeRoutes.studio.editChannel(), element: <CreateEditChannelView /> },
  { path: relativeRoutes.studio.videos(), element: <MyVideosView /> },
  { path: relativeRoutes.studio.uploads(), element: <MyUploadsView /> },
]

const StudioLayout = () => {
  const navigate = useNavigate()
  const { isUserConnectedToInternet, nodeConnectionStatus } = useConnectionStatus()
  const { extensionConnected: extensionStatus } = useJoystream()

  const {
    activeUser: { accountId, memberId, channelId },
    setActiveChannel,
    loading: activeUserLoading,
  } = useActiveUser()

  const [channelLoading, setChannelLoading] = useState(false)
  const extensionConnectionLoading = extensionStatus === null
  const extensionConnected = extensionStatus === true

  const accountSet = !!accountId && extensionConnected
  const memberSet = accountSet && !!memberId
  const channelSet = memberSet && !!channelId

  // TODO: this should just go to join()
  const extensionRoute = extensionConnected ? absoluteRoutes.studio.join({ step: '2' }) : absoluteRoutes.studio.join()
  const accountRoute = accountSet ? absoluteRoutes.studio.signIn() : extensionRoute
  const channelRoute = channelSet ? absoluteRoutes.studio.videos() : accountRoute

  // const authedStudioRoutes = studioRoutes.map((route) => {
  //   if (route.path === relativeRoutes.studio.index()) {
  //     return { ...route, isAuth: false, redirectTo: channelRoute }
  //   }
  //   if (route.path === relativeRoutes.studio.signIn() || route.path === relativeRoutes.studio.newMembership()) {
  //     return { ...route, isAuth: accountSet, redirectTo: extensionRoute }
  //   }
  //
  //   if (route.path === relativeRoutes.studio.join()) {
  //     return { ...route }
  //   }
  //
  //   return { ...route, isAuth: memberSet, redirectTo: accountRoute }
  // })

  useEffect(() => {
    if (activeUserLoading || !extensionConnected || channelId || !memberId || !accountId) {
      return
    }

    setChannelLoading(true)

    // TODO add lastChannelId and setting that to activeChannel

    if (membershipLoading) {
      return
    }
    if (!membership?.channels.length) {
      navigate(absoluteRoutes.studio.newChannel())
      setChannelLoading(false)
      return
    }
    const setChannel = async () => {
      await setActiveChannel(membership.channels[0].id)
      setChannelLoading(false)
    }
    setChannel()
  }, [
    accountId,
    activeUserLoading,
    channelId,
    extensionConnected,
    memberId,
    membership,
    membershipLoading,
    navigate,
    setActiveChannel,
  ])

  if (membershipError) {
    throw membershipError
  }

  // TODO: add route transition
  // TODO: remove dependency on PersonalDataProvider
  //  we need PersonalDataProvider because DismissibleMessage in video drafts depends on it

  return (
    <>
      <NoConnectionIndicator
        nodeConnectionStatus={nodeConnectionStatus}
        isConnectedToInternet={isUserConnectedToInternet}
      />
      <StudioTopbar hideChannelInfo={!channelSet} />
      {channelSet && <StudioSidenav />}
      {extensionConnectionLoading || channelLoading ? (
        <StudioEntrypoint />
      ) : (
        <MainContainer>
          <ErrorBoundary
            fallback={ViewErrorFallback}
            onReset={() => {
              navigate(absoluteRoutes.studio.index())
            }}
          >
            <Routes>
              {authenticatedRoutes.map(({ element, path }) => (
                <PrivateRoute
                  key={path}
                  path={path}
                  element={element}
                  isAuth={channelSet}
                  redirectTo={absoluteRoutes.studio.index()}
                />
              ))}
              <AuthRoutes channelSet={channelSet} memberSet={memberSet} accountSet={accountSet} />
              <Route path={relativeRoutes.studio.index()} element={<StudioEntrypoint />} />
            </Routes>
          </ErrorBoundary>
        </MainContainer>
      )}
    </>
  )
}

type AuthRouterProps = {
  channelSet: boolean
  memberSet: boolean
  accountSet: boolean
}
const AuthRoutes: React.FC<AuthRouterProps> = ({ channelSet, memberSet, accountSet }) => {
  if (channelSet) return <Navigate to={absoluteRoutes.studio.index()} />

  return (
    <>
      <PrivateRoute
        path={relativeRoutes.studio.signIn()}
        element={<SignInView />}
        isAuth={!memberSet}
        redirectTo={absoluteRoutes.studio.index()}
      />
      <PrivateRoute
        path={relativeRoutes.studio.join()}
        element={<div>Join</div>}
        isAuth={!memberSet}
        redirectTo={absoluteRoutes.studio.index()}
      />
      <PrivateRoute
        path={relativeRoutes.studio.firstChannel()}
        element={<div>First channel</div>}
        isAuth={memberSet}
        redirectTo={absoluteRoutes.studio.index()}
      />
      <PrivateRoute
        path={relativeRoutes.studio.newMembership()}
        element={<CreateMemberView />}
        isAuth={!memberSet && accountSet}
        redirectTo={absoluteRoutes.studio.index()}
      />
      <PrivateRoute
        path={relativeRoutes.studio.selectMembership()}
        element={<CreateMemberView />}
        isAuth={!memberSet}
        redirectTo={absoluteRoutes.studio.index()}
      />
    </>
  )
}

const MainContainer = styled.main`
  position: relative;
  padding: ${TOP_NAVBAR_HEIGHT}px var(--global-horizontal-padding) 0;
  margin-left: var(--sidenav-collapsed-width);
`

const StudioLayoutWrapper: React.FC = () => {
  return (
    <SnackbarProvider>
      <DraftsProvider>
        <PersonalDataProvider>
          <ActiveUserProvider>
            <JoystreamProvider>
              <StudioLayout />
            </JoystreamProvider>
          </ActiveUserProvider>
        </PersonalDataProvider>
      </DraftsProvider>
    </SnackbarProvider>
  )
}

export default StudioLayoutWrapper
