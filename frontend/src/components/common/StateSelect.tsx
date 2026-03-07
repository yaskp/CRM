import { useState, useEffect } from 'react'
import { Select } from 'antd'
import { masterService } from '../../services/api/master'

interface StateSelectProps {
    value?: string
    onChange?: (value: string, state_code?: string) => void
    placeholder?: string
    size?: 'large' | 'middle' | 'small'
    style?: React.CSSProperties
    disabled?: boolean
}

const StateSelect = ({ value, onChange, placeholder = 'Select State', size = 'large', style, disabled }: StateSelectProps) => {
    const [states, setStates] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchStates()
    }, [])

    const fetchStates = async () => {
        setLoading(true)
        try {
            const response = await masterService.getStates()
            setStates(response.states || [])
        } catch (error) {
            console.error('Failed to fetch states', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Select
            showSearch
            loading={loading}
            placeholder={placeholder}
            size={size}
            style={{ width: '100%', ...style }}
            value={value}
            disabled={disabled}
            onChange={(val) => {
                const state = states.find(s => s.name === val || s.state_code === val)
                if (onChange) {
                    onChange(state?.name || val, state?.state_code)
                }
            }}
            optionFilterProp="children"
        >
            {states.map(s => (
                <Select.Option key={s.id} value={s.name} label={s.name}>
                    {s.name} ({s.state_code})
                </Select.Option>
            ))}
        </Select>
    )
}

export default StateSelect
