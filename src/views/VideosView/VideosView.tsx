import React, { useState, useRef } from 'react'

import { RouteComponentProps } from '@reach/router'
import { ErrorBoundary } from '@sentry/react'
import { useInView } from 'react-intersection-observer'
import { useFeaturedVideos, useCategories } from '@/api/hooks'

import { ErrorFallback, BackgroundPattern, VideoGallery } from '@/components'
import { TOP_NAVBAR_HEIGHT } from '@/components/TopNavbar'
import {
  StyledText,
  StyledCategoryPicker,
  Container,
  StyledInfiniteVideoGrid,
  IntersectionTarget,
  Header,
  GRID_TOP_PADDING,
} from './VideosView.style'

const VideosView: React.FC<RouteComponentProps> = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const { loading: categoriesLoading, data: categoriesData, error: categoriesError } = useCategories()
  const {
    loading: featuredVideosLoading,
    data: featuredVideosData,
    error: featuredVideosError,
    refetch: refetchFeaturedVideos,
  } = useFeaturedVideos()

  const topicsRef = useRef<HTMLHeadingElement>(null)
  const { ref: targetRef, inView } = useInView({
    rootMargin: `-${TOP_NAVBAR_HEIGHT - GRID_TOP_PADDING}px 0px 0px`,
  })
  const handleCategoryChange = (categoryId: string | null, scrollTop = true) => {
    setSelectedCategoryId(categoryId)
    if (topicsRef.current && scrollTop) {
      setTimeout(() => {
        topicsRef.current?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' })
      })
    }
  }

  if (categoriesError) {
    throw categoriesError
  }
  const featuredVideos = featuredVideosData?.map((featuredVideo) => featuredVideo.video)
  const hasFeaturedVideosError = featuredVideosError && !featuredVideosLoading
  return (
    <Container>
      <BackgroundPattern />
      <Header variant="hero">Videos</Header>
      {!hasFeaturedVideosError ? (
        <VideoGallery title="Featured" loading={featuredVideosLoading} videos={featuredVideos} />
      ) : (
        <ErrorFallback error={featuredVideosError} resetError={() => refetchFeaturedVideos()} />
      )}
      <StyledText ref={topicsRef} variant="h5">
        Topics that may interest you
      </StyledText>
      <IntersectionTarget ref={targetRef} />
      <StyledCategoryPicker
        categories={categoriesData}
        loading={categoriesLoading}
        selectedCategoryId={selectedCategoryId}
        onChange={handleCategoryChange}
        isAtTop={inView}
      />
      <ErrorBoundary fallback={ErrorFallback}>
        <StyledInfiniteVideoGrid categoryId={selectedCategoryId || undefined} ready={!!categoriesData} />
      </ErrorBoundary>
    </Container>
  )
}

export default VideosView