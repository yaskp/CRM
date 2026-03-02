import React, { useState } from 'react'
import { Upload, Button, App, Typography, Space } from 'antd'
import { UploadOutlined, FileOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { getSecondaryButtonStyle } from '../../styles/styleUtils'

interface FileUploadProps {
    value?: string
    onChange?: (url: string) => void
    folder?: string
    placeholder?: string
    accept?: string
}

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api'
const API_BASE = API_URL.replace('/api', '')

export const FileUpload: React.FC<FileUploadProps> = ({
    value,
    onChange,
    folder = 'common',
    placeholder = 'Click to Upload',
    accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png'
}) => {
    const [loading, setLoading] = useState(false)
    const { message: msg } = App.useApp()

    const uploadProps: UploadProps = {
        name: 'file',
        action: `${API_URL}/upload?folder=${folder}`,
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        showUploadList: false,
        beforeUpload: (file) => {
            const isLt10M = file.size / 1024 / 1024 < 10
            if (!isLt10M) {
                msg.error('File must be smaller than 10MB!')
            }
            return isLt10M
        },
        onChange: (info) => {
            if (info.file.status === 'uploading') {
                setLoading(true)
                return
            }
            if (info.file.status === 'done') {
                setLoading(false)
                const url = info.file.response.file.url
                msg.success(`${info.file.name} file uploaded successfully`)
                if (onChange) {
                    onChange(url)
                }
            } else if (info.file.status === 'error') {
                setLoading(false)
                msg.error(`${info.file.name} file upload failed.`)
            }
        },
        accept
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (onChange) {
            onChange('')
        }
    }

    const getFileUrl = (url?: string) => {
        if (!url) return undefined
        if (url.startsWith('http')) return url
        return `${API_BASE}${url}`
    }

    return (
        <div style={{ width: '100%' }}>
            {value ? (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    background: '#fafafa'
                }}>
                    <Space>
                        <FileOutlined style={{ color: '#1890ff' }} />
                        <Typography.Text ellipsis style={{ maxWidth: 200 }}>
                            <a href={getFileUrl(value)} target="_blank" rel="noopener noreferrer">
                                {value.split('/').pop()}
                            </a>
                        </Typography.Text>
                    </Space>
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleDelete}
                        size="small"
                    />
                </div>
            ) : (
                <Upload {...uploadProps}>
                    <Button
                        style={{ ...getSecondaryButtonStyle(), width: '100%' }}
                        icon={loading ? <LoadingOutlined /> : <UploadOutlined />}
                        loading={loading}
                    >
                        {placeholder}
                    </Button>
                </Upload>
            )}
        </div>
    )
}
