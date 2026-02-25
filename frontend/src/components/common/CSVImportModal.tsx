import React, { useState } from 'react';
import { Modal, Upload, Button, Table, message, Space, Typography, Tag, Alert } from 'antd';
import { UploadOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import Papa from 'papaparse';
import axios from 'axios';

const { Text, Title } = Typography;

interface Column {
    title: string;
    dataIndex: string;
    key: string;
    required?: boolean;
}

interface CSVImportModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    title: string;
    apiEndpoint: string;
    columns: Column[];
    templateData: any[];
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({
    visible,
    onCancel,
    onSuccess,
    title,
    apiEndpoint,
    columns,
    templateData,
}) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [results, setResults] = useState<{
        success: any[];
        updated?: any[];
        errors: any[];
        duplicates?: any[];
    } | null>(null);

    const handleCancel = () => {
        setResults(null);
        setData([]);
        onCancel();
    };

    const handleFileUpload = (file: File) => {
        setLoading(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsedData = results.data.map((row: any, index: number) => ({
                    ...row,
                    key: index,
                    _errors: validateRow(row)
                }));
                setData(parsedData);
                setLoading(false);
                setResults(null);
            },
            error: (error) => {
                message.error(`Error parsing CSV: ${error.message}`);
                setLoading(false);
            }
        });
        return false; // Prevent auto-upload
    };

    const validateRow = (row: any) => {
        const errors: string[] = [];
        columns.forEach(col => {
            if (col.required && !row[col.dataIndex]) {
                errors.push(`${col.title} is required`);
            }
        });
        return errors;
    };

    const downloadTemplate = () => {
        const csv = Papa.unparse(templateData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${title.replace(/\s+/g, '_').toLowerCase()}_template.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = async () => {
        const validData = data.filter(row => row._errors.length === 0);
        if (validData.length === 0) {
            message.warning('No valid data to import');
            return;
        }

        setImporting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(apiEndpoint, { items: validData }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setResults(response.data.data);
                message.success(response.data.message);
                if (response.data.data.success.length > 0) {
                    onSuccess();
                }
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to import data');
        } finally {
            setImporting(false);
        }
    };

    const previewColumns = [
        ...columns.map(col => ({
            title: col.title,
            dataIndex: col.dataIndex,
            key: col.key,
            render: (text: any, record: any) => {
                const hasError = record._errors.some((e: string) => e.includes(col.title));
                return (
                    <div style={{ color: hasError ? 'red' : 'inherit' }}>
                        {text}
                        {hasError && <WarningOutlined style={{ marginLeft: 4 }} />}
                    </div>
                );
            }
        })),
        {
            title: 'Status',
            key: 'status',
            render: (_: any, record: any) => {
                if (record._errors.length > 0) {
                    return <Tag color="error" icon={<CloseCircleOutlined />}>Invalid</Tag>;
                }
                return <Tag color="success" icon={<CheckCircleOutlined />}>Ready</Tag>;
            }
        }
    ];

    return (
        <Modal
            title={`Import ${title}`}
            open={visible}
            onCancel={handleCancel}
            width={1000}
            footer={results ? [
                <Button key="close" type="primary" onClick={() => {
                    onSuccess(); // Refresh parent data
                    handleCancel(); // Reset and close
                }}>
                    Done
                </Button>
            ] : [
                <Button key="cancel" onClick={handleCancel}>
                    Cancel
                </Button>,
                <Button
                    key="import"
                    type="primary"
                    onClick={handleImport}
                    loading={importing}
                    disabled={data.length === 0 || data.every(r => r._errors.length > 0)}
                >
                    Import {data.filter(r => r._errors.length === 0).length} Items
                </Button>,
            ]}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                {!results && (
                    <Alert
                        message="Instructions"
                        description={
                            <ul>
                                <li>Download the template to see the required format.</li>
                                <li>Required fields are marked in the CSV.</li>
                                <li>Duplicate codes will be skipped automatically.</li>
                                <li>Invalid rows will be highlighted and won't be imported.</li>
                            </ul>
                        }
                        type="info"
                        showIcon
                    />
                )}

                {!results && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                            <Upload
                                accept=".csv"
                                beforeUpload={handleFileUpload}
                                showUploadList={false}
                            >
                                <Button icon={<UploadOutlined />} loading={loading}>
                                    Select CSV File
                                </Button>
                            </Upload>
                            {data.length > 0 && <Text type="secondary">{data.length} rows loaded</Text>}
                        </Space>
                        <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
                            Download Template
                        </Button>
                    </div>
                )}

                {results && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                        <Title level={3}>Import Completed Successfully</Title>
                        <Space size="middle">
                            <Tag color="success" style={{ padding: '4px 12px', fontSize: 14 }}>
                                {(results.success?.length || 0) + (results.updated?.length || 0)} Imported/Updated
                            </Tag>
                            {(results.duplicates?.length || 0) > 0 && (
                                <Tag color="warning" style={{ padding: '4px 12px', fontSize: 14 }}>
                                    {results.duplicates.length} Duplicates Skipped
                                </Tag>
                            )}
                            {(results.errors?.length || 0) > 0 && (
                                <Tag color="error" style={{ padding: '4px 12px', fontSize: 14 }}>
                                    {results.errors.length} Errors Occurred
                                </Tag>
                            )}
                        </Space>
                    </div>
                )}

                {data.length > 0 && !results && (
                    <Table
                        dataSource={data}
                        columns={previewColumns}
                        pagination={{ pageSize: 5 }}
                        size="small"
                        rowClassName={(record) => record._errors.length > 0 ? 'error-row' : ''}
                    />
                )}

                {results && results.errors.length > 0 && (
                    <div>
                        <Title level={5}>Errors Details</Title>
                        <Table
                            dataSource={results.errors}
                            columns={[
                                { title: 'Item', dataIndex: ['item', 'name'], key: 'name' },
                                { title: 'Code', dataIndex: ['item', 'material_code'], key: 'code' },
                                { title: 'Error', dataIndex: 'error', key: 'error', render: (text) => <Text type="danger">{text}</Text> }
                            ]}
                            pagination={{ pageSize: 5 }}
                            size="small"
                        />
                    </div>
                )}
            </Space>
        </Modal>
    );
};

export default CSVImportModal;
