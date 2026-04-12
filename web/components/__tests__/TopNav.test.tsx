import { render, screen } from '@testing-library/react'
import { TopNav } from '../TopNav'

describe('TopNav', () => {
  test('logo görünür', () => {
    render(<TopNav activeTab="create" onTabChange={() => {}} />)
    expect(screen.getByText('🎬 VideoEdit')).toBeInTheDocument()
  })

  test('3 tab gösterir', () => {
    render(<TopNav activeTab="create" onTabChange={() => {}} />)
    expect(screen.getByText('Video Oluştur')).toBeInTheDocument()
    expect(screen.getByText('Altyazı Ekle')).toBeInTheDocument()
    expect(screen.getByText('Geçmiş')).toBeInTheDocument()
  })

  test('aktif tab underline alır', () => {
    render(<TopNav activeTab="subtitle" onTabChange={() => {}} />)
    const subtitleTab = screen.getByText('Altyazı Ekle').closest('button')
    expect(subtitleTab).toHaveClass('border-b-2')
  })

  test('tab tıklandığında onTabChange çağrılır', async () => {
    const onChange = jest.fn()
    const { getByText } = render(<TopNav activeTab="create" onTabChange={onChange} />)
    getByText('Geçmiş').closest('button')!.click()
    expect(onChange).toHaveBeenCalledWith('history')
  })
})
