import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ParamForm } from '../ParamForm'

const productAdDefaults = {
  title: 'Test başlık',
  features: ['Özellik 1', 'Özellik 2'],
  cta: 'test.com',
  accentColor: '#e67e22',
  fontFamily: 'sans-serif',
}

describe('ParamForm', () => {
  test('ProductAd için başlık alanı gösterir', () => {
    render(
      <ParamForm
        templateId="ProductAd"
        values={productAdDefaults}
        onChange={() => {}}
        onSubmit={() => {}}
        loading={false}
      />
    )
    expect(screen.getByLabelText('Başlık')).toBeInTheDocument()
    expect(screen.getByLabelText('CTA Metni')).toBeInTheDocument()
  })

  test('onChange başlık değiştiğinde çağrılır', async () => {
    const onChange = jest.fn()
    render(
      <ParamForm
        templateId="ProductAd"
        values={productAdDefaults}
        onChange={onChange}
        onSubmit={() => {}}
        loading={false}
      />
    )
    const input = screen.getByLabelText('Başlık')
    await userEvent.clear(input)
    await userEvent.type(input, 'Yeni Başlık')
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringContaining('Y') }))
  })

  test('loading=true iken buton disabled', () => {
    render(
      <ParamForm
        templateId="ProductAd"
        values={productAdDefaults}
        onChange={() => {}}
        onSubmit={() => {}}
        loading={true}
      />
    )
    expect(screen.getByRole('button', { name: /render/i })).toBeDisabled()
  })
})
