// web/components/__tests__/ParamForm.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ParamForm } from '../ParamForm'

const productAdDefaults = {
  title: 'Test başlık',
  showTitle: true,
  titleStartSec: 0,
  titleDurationSec: 10,
  titleEntryAnim: 'fade',
  titleExitAnim: 'fade-out',
  body: [],
  showBody: true,
  cta: 'test.com',
  showCta: true,
  ctaMode: 'text',
  ctaStartSec: 20,
  ctaDurationSec: 8,
  ctaEntryAnim: 'slide-up',
  ctaExitAnim: 'fade-out',
  ctaBgColor: '#e67e22',
  ctaOpacity: 100,
  ctaLogoUrl: '',
  ctaLogoHeight: 80,
  accentColor: '#e67e22',
  accentOpacity: 100,
  backgroundColor: '#1a1a2e',
  fontFamily: 'sans-serif',
  backgroundMedia: '',
  titleFontSize: 72,
  bodyFontSize: 36,
}

describe('ParamForm', () => {
  test('Başlık accordion toggle ve metin alanı görünür', () => {
    render(<ParamForm templateId="ProductAd" values={productAdDefaults} onChange={() => {}} onSubmit={() => {}} loading={false} />)
    expect(screen.getByText('Başlık')).toBeInTheDocument()
  })

  test('onChange başlık değiştiğinde çağrılır', async () => {
    const onChange = jest.fn()
    render(<ParamForm templateId="ProductAd" values={productAdDefaults} onChange={onChange} onSubmit={() => {}} loading={false} />)
    const input = screen.getByPlaceholderText('Başlık metni')
    await userEvent.clear(input)
    await userEvent.type(input, 'Y')
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringContaining('Y') }))
  })

  test('showCta toggle false yapınca onChange çağrılır', async () => {
    const onChange = jest.fn()
    render(<ParamForm templateId="ProductAd" values={productAdDefaults} onChange={onChange} onSubmit={() => {}} loading={false} />)
    const ctaToggle = screen.getByTestId('toggle-cta')
    await userEvent.click(ctaToggle)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ showCta: false }))
  })

  test('loading=true iken buton disabled', () => {
    render(<ParamForm templateId="ProductAd" values={productAdDefaults} onChange={() => {}} onSubmit={() => {}} loading={true} />)
    expect(screen.getByRole('button', { name: /render/i })).toBeDisabled()
  })
})
