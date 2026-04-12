// web/components/__tests__/ColorPicker.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColorPicker } from '../ColorPicker'

describe('ColorPicker', () => {
  test('renders "renk yok" swatch as first option', () => {
    render(<ColorPicker value="#e67e22" opacity={100} onChange={() => {}} />)
    expect(screen.getByTitle('Renk yok')).toBeInTheDocument()
  })

  test('calls onChange with empty string when "renk yok" clicked', async () => {
    const onChange = jest.fn()
    render(<ColorPicker value="#e67e22" opacity={100} onChange={onChange} />)
    await userEvent.click(screen.getByTitle('Renk yok'))
    expect(onChange).toHaveBeenCalledWith({ color: '', opacity: 100 })
  })

  test('calls onChange with color when swatch clicked', async () => {
    const onChange = jest.fn()
    render(<ColorPicker value="" opacity={100} onChange={onChange} />)
    await userEvent.click(screen.getByTitle('#ef4444'))
    expect(onChange).toHaveBeenCalledWith({ color: '#ef4444', opacity: 100 })
  })

  test('switches palette tab', async () => {
    render(<ColorPicker value="#e67e22" opacity={100} onChange={() => {}} />)
    await userEvent.click(screen.getByText('Neon'))
    expect(screen.getByTitle('#ff0090')).toBeInTheDocument()
  })

  test('shows active state on selected color', () => {
    render(<ColorPicker value="#e67e22" opacity={100} onChange={() => {}} />)
    expect(screen.getByTitle('#e67e22').closest('button')).toHaveClass('ring-2')
  })
})
