import { Button, IconButton, Text } from '@/shared/components'
import { colors, sizes } from '@/shared/theme'
import styled from '@emotion/styled'

export const TermsBox = styled.div`
  scroll-behavior: smooth;
  text-align: left;
  margin-top: ${sizes(6)};
  margin-bottom: ${sizes(10)};
  position: relative;
  height: 300px;
  width: 100%;
  background-color: ${colors.gray[800]};
  overflow: auto;
`
export const TextWrapper = styled.div`
  margin: ${sizes(9)} ${sizes(8)};
  max-width: 450px;
`
export const TermsParagraph = styled(Text)`
  margin-top: 24px;
  color: ${colors.gray[200]};
`

export const TermsOverlay = styled.div`
  position: sticky;
  left: 0;
  bottom: 0;
  height: 35%;
  width: auto;
  background: linear-gradient(180deg, transparent 0%, ${colors.gray[800]} 100%);
`
export const ScrollButton = styled(IconButton)`
  position: absolute;
  right: ${sizes(6)};
  bottom: ${sizes(6)};
`

export const ContinueButton = styled(Button)`
  margin-left: auto;
`