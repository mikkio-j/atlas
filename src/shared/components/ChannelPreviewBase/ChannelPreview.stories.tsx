import React from 'react'
import ChannelPreviewBase, { ChannelPreviewBaseProps } from './ChannelPreviewBase'
import { Meta, Story } from '@storybook/react'

export default {
  title: 'Shared/ChannelPreview',
  component: ChannelPreviewBase,
  argTypes: {
    className: { table: { disable: true } },
    onClick: { table: { disable: true } },
  },
} as Meta

const Template: Story<ChannelPreviewBaseProps> = (args) => <ChannelPreviewBase {...args} />
const PlaceholderTemplate: Story<ChannelPreviewBaseProps> = (args) => <ChannelPreviewBase {...args} />

export const Regular = Template.bind({})
Regular.args = {
  handle: 'Test channel',
  avatarUrl: 'https://eu-central-1.linodeobjects.com/atlas-assets/channel-avatars/2.jpg',
  videoCount: 0,
  loading: false,
}
export const Placeholder = PlaceholderTemplate.bind({})