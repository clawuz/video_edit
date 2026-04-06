import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TemplateGrid } from '../TemplateGrid'

describe('TemplateGrid', () => {
  test('3 şablon kartı gösterir', () => {
    render(<TemplateGrid selected="ProductAd" onSelect={() => {}} />)
    expect(screen.getByText('Ürün Reklamı')).toBeInTheDocument()
    expect(screen.getByText('İstatistik')).toBeInTheDocument()
    expect(screen.getByText('Talking Head')).toBeInTheDocument()
  })

  test('seçili kart kalın border alır', () => {
    render(<TemplateGrid selected="Stats" onSelect={() => {}} />)
    const statsCard = screen.getByText('İstatistik').closest('button')
    expect(statsCard).toHaveClass('border-gray-900')
  })

  test('kart tıklandığında onSelect çağrılır', async () => {
    const onSelect = jest.fn()
    render(<TemplateGrid selected="ProductAd" onSelect={onSelect} />)
    await userEvent.click(screen.getByText('Talking Head'))
    expect(onSelect).toHaveBeenCalledWith('TalkingHead')
  })
})
