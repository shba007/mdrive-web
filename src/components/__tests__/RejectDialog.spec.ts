import { describe, expect, it } from 'vite-plus/test'
import { mount } from '@vue/test-utils'
import RejectDialog from '../RejectDialog.vue'

const mountDialog = (props: Record<string, unknown> = {}) =>
  mount(RejectDialog, {
    props: { open: true, filename: 'a.jpg', ...props },
    global: { stubs: { teleport: true } },
  })

describe('RejectDialog', () => {
  it('requires a reason before sending', async () => {
    const wrapper = mountDialog()
    const submit = wrapper.get('button[type="submit"]')
    expect((submit.element as HTMLButtonElement).disabled).toBe(true)

    await wrapper.get('textarea').setValue('  too orange  ')
    const enabled = wrapper.get('button[type="submit"]').element as HTMLButtonElement
    expect(enabled.disabled).toBe(false)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toEqual([['too orange']])
  })

  it('does not send an empty reason', async () => {
    const wrapper = mountDialog()
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('emits close on cancel', async () => {
    const wrapper = mountDialog()
    await wrapper.get('button[type="button"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})