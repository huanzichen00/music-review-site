import { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Card, Typography, message, Select, 
  InputNumber, Space, Divider, Modal, Alert 
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { albumsApi } from '../api/albums';
import { artistsApi } from '../api/artists';
import { genresApi } from '../api/genres';
import { importApi } from '../api/import';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Common countries for music artists
const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Germany',
  'France',
  'Italy',
  'Japan',
  'Canada',
  'Australia',
  'Sweden',
  'Norway',
  'Netherlands',
  'Belgium',
  'Spain',
  'Brazil',
  'Argentina',
  'Poland',
  'Russia',
  'Finland',
  'Denmark',
  'Austria',
  'Switzerland',
  'Ireland',
  'New Zealand',
  'South Korea',
  'China',
  'Mexico',
  'Chile',
  'Greece',
  'Portugal',
  'Czech Republic',
  'Hungary',
  'Israel',
  'Turkey',
  'South Africa',
  'India',
];

const AddAlbum = () => {
  const [form] = Form.useForm();
  const [artistForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [artists, setArtists] = useState([]);
  const [genres, setGenres] = useState([]);
  const [artistModalVisible, setArtistModalVisible] = useState(false);
  const [artistLoading, setArtistLoading] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importedArtist, setImportedArtist] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      message.info('Please login first');
      navigate('/login');
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const [artistsRes, genresRes] = await Promise.all([
        artistsApi.getAll(),
        genresApi.getAll(),
      ]);
      setArtists(artistsRes.data);
      setGenres(genresRes.data);
    } catch (error) {
      message.error('Failed to load data');
    }
  };

  const handleImport = async () => {
    if (!importUrl.trim()) {
      message.warning('Please enter a NetEase Music album URL');
      return;
    }

    setImporting(true);
    try {
      const response = await importApi.fromNetease(importUrl);
      const data = response.data;

      // Fill form with imported data
      form.setFieldsValue({
        title: data.title,
        releaseYear: data.releaseYear,
        coverUrl: data.coverUrl,
        description: data.description,
        tracks: data.tracks?.map(track => ({
          title: track.title,
          minutes: track.minutes,
          seconds: track.seconds,
        })) || [{ title: '' }],
      });

      // Store imported artist info for later use
      if (data.artist) {
        setImportedArtist(data.artist);
      }

      message.success('Album imported successfully! Please select or create an artist.');
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to import from NetEase Music');
    } finally {
      setImporting(false);
    }
  };

  const handleCreateImportedArtist = async () => {
    if (!importedArtist) return;

    setArtistLoading(true);
    try {
      const response = await artistsApi.create({
        name: importedArtist.name,
        photoUrl: importedArtist.photoUrl,
      });
      message.success('Artist created successfully!');
      setArtists([...artists, response.data]);
      form.setFieldValue('artistId', response.data.id);
      setImportedArtist(null);
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to create artist');
    } finally {
      setArtistLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const albumData = {
        title: values.title,
        artistId: values.artistId,
        releaseYear: values.releaseYear,
        coverUrl: values.coverUrl,
        description: values.description,
        genreIds: values.genreIds,
        tracks: values.tracks?.map((track, index) => ({
          trackNumber: index + 1,
          title: track.title,
          duration: track.minutes ? track.minutes * 60 + (track.seconds || 0) : null,
        })),
      };

      const response = await albumsApi.create(albumData);
      message.success('Album created successfully!');
      navigate(`/albums/${response.data.id}`);
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to create album');
    } finally {
      setLoading(false);
    }
  };

  const handleAddArtist = async (values) => {
    setArtistLoading(true);
    try {
      const response = await artistsApi.create(values);
      message.success('Artist created successfully!');
      setArtists([...artists, response.data]);
      form.setFieldValue('artistId', response.data.id);
      setArtistModalVisible(false);
      artistForm.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to create artist');
    } finally {
      setArtistLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>Add New Album</Title>

      {/* Import from NetEase */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={4}>
          <CloudDownloadOutlined style={{ marginRight: 8 }} />
          Import from NetEase Music
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Paste a NetEase Music album link to auto-fill album info and track list
        </Text>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="https://music.163.com/#/album?id=xxxxx"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            onPressEnter={handleImport}
            style={{ flex: 1 }}
          />
          <Button 
            type="primary" 
            onClick={handleImport} 
            loading={importing}
            icon={<CloudDownloadOutlined />}
          >
            Import
          </Button>
        </Space.Compact>
      </Card>

      {/* Imported Artist Alert */}
      {importedArtist && (
        <Alert
          message="Artist from Import"
          description={
            <div>
              <Text>Imported artist: <strong>{importedArtist.name}</strong></Text>
              <br />
              <Button 
                type="link" 
                onClick={handleCreateImportedArtist}
                loading={artistLoading}
                style={{ padding: 0, marginTop: 8 }}
              >
                Click to create this artist
              </Button>
              <Text type="secondary"> or select an existing artist below</Text>
            </div>
          }
          type="info"
          showIcon
          closable
          onClose={() => setImportedArtist(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ tracks: [{ title: '' }] }}
        >
          {/* Basic Info */}
          <Title level={4}>Basic Information</Title>
          
          <Form.Item
            name="title"
            label="Album Title"
            rules={[{ required: true, message: 'Please enter album title' }]}
          >
            <Input placeholder="Enter album title" />
          </Form.Item>

          <Form.Item
            name="artistId"
            label="Artist"
            rules={[{ required: true, message: 'Please select an artist' }]}
          >
            <Select
              placeholder="Select artist"
              showSearch
              optionFilterProp="children"
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: '8px 0' }} />
                  <Button 
                    type="text" 
                    icon={<PlusOutlined />} 
                    onClick={() => setArtistModalVisible(true)}
                    style={{ width: '100%' }}
                  >
                    Add New Artist
                  </Button>
                </>
              )}
            >
              {artists.map((artist) => (
                <Option key={artist.id} value={artist.id}>
                  {artist.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="releaseYear" label="Release Year">
            <InputNumber 
              min={1900} 
              max={new Date().getFullYear()} 
              placeholder="e.g. 1973" 
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="genreIds" label="Genres">
            <Select
              mode="multiple"
              placeholder="Select genres"
              optionFilterProp="children"
            >
              {genres.map((genre) => (
                <Option key={genre.id} value={genre.id}>
                  {genre.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="coverUrl" label="Cover Image URL">
            <Input placeholder="https://example.com/cover.jpg" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={4} placeholder="Album description..." />
          </Form.Item>

          {/* Track List */}
          <Divider />
          <Title level={4}>Track List</Title>

          <Form.List name="tracks">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Space 
                    key={key} 
                    style={{ display: 'flex', marginBottom: 8 }} 
                    align="baseline"
                  >
                    <span style={{ width: 30 }}>{index + 1}.</span>
                    <Form.Item
                      {...restField}
                      name={[name, 'title']}
                      rules={[{ required: true, message: 'Enter track title' }]}
                      style={{ marginBottom: 0, flex: 1, minWidth: 200 }}
                    >
                      <Input placeholder="Track title" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'minutes']}
                      style={{ marginBottom: 0, width: 70 }}
                    >
                      <InputNumber min={0} placeholder="min" />
                    </Form.Item>
                    <span>:</span>
                    <Form.Item
                      {...restField}
                      name={[name, 'seconds']}
                      style={{ marginBottom: 0, width: 70 }}
                    >
                      <InputNumber min={0} max={59} placeholder="sec" />
                    </Form.Item>
                    {fields.length > 1 && (
                      <MinusCircleOutlined 
                        onClick={() => remove(name)} 
                        style={{ color: '#ff4d4f' }}
                      />
                    )}
                  </Space>
                ))}
                <Form.Item>
                  <Button 
                    type="dashed" 
                    onClick={() => add()} 
                    icon={<PlusOutlined />}
                    style={{ width: '100%' }}
                  >
                    Add Track
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large" block>
              Create Album
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Add Artist Modal */}
      <Modal
        title="Add New Artist"
        open={artistModalVisible}
        onCancel={() => setArtistModalVisible(false)}
        footer={null}
      >
        <Form form={artistForm} layout="vertical" onFinish={handleAddArtist}>
          <Form.Item
            name="name"
            label="Artist Name"
            rules={[{ required: true, message: 'Please enter artist name' }]}
          >
            <Input placeholder="e.g. Pink Floyd" />
          </Form.Item>
          <Form.Item name="country" label="Country">
            <Select 
              placeholder="Select country" 
              showSearch
              optionFilterProp="children"
              allowClear
            >
              {COUNTRIES.map((country) => (
                <Option key={country} value={country}>
                  {country}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="formedYear" label="Formed Year">
            <InputNumber 
              min={1900} 
              max={new Date().getFullYear()} 
              placeholder="e.g. 1965"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Artist bio..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={artistLoading} block>
              Create Artist
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddAlbum;
