import styled from '@emotion/styled'
import { css } from '@emotion/react'
import { colors, sizes, breakpoints, typography } from '../../theme'
import { Text, Button } from '@/shared/components'

type StyledExitButtonProps = {
  marginLeft?: boolean
}

export const StyledBackdrop = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
`

export const StyledContainer = styled.div`
  width: 100%;
  max-width: ${sizes(110)};
  margin: 0 auto;
  background-color: ${colors.gray[600]};
  padding: ${sizes(4)};
  box-shadow: 0px 8px 8px rgba(0, 0, 0, 0.12), 0px 24px 40px rgba(0, 0, 0, 0.16);
  @media screen and (min-width: ${breakpoints.small}) {
    padding: ${sizes(6)};
  }
`

export const StyledTitleText = styled(Text)`
  margin-bottom: ${sizes(3)};
`

export const StyledContentText = styled(Text)`
  color: ${colors.white};
  font-weight: ${typography.weights.thin};
  margin-bottom: ${sizes(6)};
  word-wrap: break-word;
`

export const StyledHeadRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${sizes(4)};
`

export const StyledButtonContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  @media screen and (min-width: ${breakpoints.small}) {
    flex-direction: row;
    justify-content: flex-end;
  }
`

export const StyledPrimaryButton = styled(Button)`
  margin-bottom: ${sizes(2)};
  @media screen and (min-width: ${breakpoints.small}) {
    margin-left: ${sizes(2)};
    margin-bottom: 0;
  }
`

export const StyledSecondaryButton = styled(Button)`
  background-color: ${colors.transparent};
  color: ${colors.white};
  border: 1px solid ${colors.gray[500]};
  &:hover {
    background-color: ${colors.gray[500]};
    border: 1px solid ${colors.gray[500]};
    color: ${colors.white};
  }
  &:active {
    background-color: ${colors.transparent};
    border: 1px solid ${colors.gray[500]};
  }
`

export const StyledExitButton = styled(Button)<StyledExitButtonProps>`
  padding: 0;
  background-color: ${colors.transparent};
  border: none;
  margin-left: ${({ marginLeft }) => marginLeft && 'auto'};
  &:hover {
    background-color: ${colors.transparent};
  }
`

export const dialogTransitions = css`
  &.dialog-enter {
    opacity: 0;
    transform: scale(0.88);
  }
  &.dialog-enter-active {
    opacity: 1;
    transform: scale(1);
    transition: 150ms cubic-bezier(0.25, 0.01, 0.25, 1);
  }
  &.dialog-exit {
    opacity: 1;
    transform: scale(1);
  }
  &.dialog-exit-active {
    opacity: 0;
    transform: scale(0.88);
    transition: 100ms cubic-bezier(0.25, 0.01, 0.25, 1);
  }
`