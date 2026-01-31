import { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Card, Typography, message, Select, 
  InputNumber, Space, Divider, Modal, Alert, List, Spin, Tabs
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, SearchOutlined } from '@ant-design/icons';
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
  const [genreForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [artists, setArtists] = useState([]);
  const [genres, setGenres] = useState([]);
  const [artistModalVisible, setArtistModalVisible] = useState(false);
  const [artistLoading, setArtistLoading] = useState(false);
  const [genreModalVisible, setGenreModalVisible] = useState(false);
  const [genreLoading, setGenreLoading] = useState(false);
  const [importedArtist, setImportedArtist] = useState(null);
  const [batchTrackModalVisible, setBatchTrackModalVisible] = useState(false);
  const [batchTrackText, setBatchTrackText] = useState('');
  
  // MusicBrainz search states
  const [searchAlbum, setSearchAlbum] = useState('');
  const [searchArtist, setSearchArtist] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  
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

  // Search albums from MusicBrainz
  const handleSearch = async () => {
    if (!searchAlbum.trim() && !searchArtist.trim()) {
      message.warning('Please enter album name or artist name');
      return;
    }

    setSearching(true);
    setSearchResults([]);
    try {
      const response = await importApi.searchAlbums(searchAlbum, searchArtist, 15);
      setSearchResults(response.data.results || []);
      if (response.data.results?.length === 0) {
        message.info('No albums found. Try different search terms.');
      }
    } catch (error) {
      message.error(error.response?.data?.error || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  // Import selected album from MusicBrainz
  const handleImportAlbum = async (mbid) => {
    setImporting(true);
    try {
      const response = await importApi.getAlbumDetails(mbid);
      const data = response.data;

      // Fill form with imported data
      form.setFieldsValue({
        title: data.title,
        releaseYear: data.releaseYear,
        coverUrl: data.coverUrl,
        description: data.description || '',
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

      message.success(`Imported "${data.title}" with ${data.trackCount} tracks!`);
      setSearchResults([]);
      setSearchAlbum('');
      setSearchArtist('');
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to import album');
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

  const handleAddGenre = async (values) => {
    setGenreLoading(true);
    try {
      const response = await genresApi.create(values);
      message.success('Genre created successfully!');
      setGenres([...genres, response.data]);
      // Add to current selection
      const currentGenres = form.getFieldValue('genreIds') || [];
      form.setFieldValue('genreIds', [...currentGenres, response.data.id]);
      setGenreModalVisible(false);
      genreForm.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to create genre');
    } finally {
      setGenreLoading(false);
    }
  };

  // Parse batch track text and fill form
  const handleBatchTrackImport = () => {
    if (!batchTrackText.trim()) {
      message.warning('Please enter track list');
      return;
    }

    const lines = batchTrackText.trim().split('\n');
    const tracks = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Try to parse: "1. Track Name 3:45" or "Track Name 3:45" or just "Track Name"
      // Remove leading numbers like "1." or "01."
      let trackLine = trimmed.replace(/^\d+[\.\)]\s*/, '');
      
      // Try to extract duration at the end (formats: 3:45, 03:45, 3:45:00)
      const durationMatch = trackLine.match(/\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*$/);
      let minutes = null;
      let seconds = null;
      
      if (durationMatch) {
        if (durationMatch[3]) {
          // Format: H:MM:SS
          minutes = parseInt(durationMatch[1]) * 60 + parseInt(durationMatch[2]);
          seconds = parseInt(durationMatch[3]);
        } else {
          // Format: M:SS
          minutes = parseInt(durationMatch[1]);
          seconds = parseInt(durationMatch[2]);
        }
        trackLine = trackLine.replace(/\s+\d{1,2}:\d{2}(?::\d{2})?\s*$/, '');
      }
      
      if (trackLine) {
        tracks.push({
          title: trackLine.trim(),
          minutes,
          seconds,
        });
      }
    }
    
    if (tracks.length > 0) {
      form.setFieldValue('tracks', tracks);
      message.success(`Imported ${tracks.length} tracks!`);
      setBatchTrackModalVisible(false);
      setBatchTrackText('');
    } else {
      message.warning('No valid tracks found');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>Add New Album</Title>

      {/* Search and Import from MusicBrainz */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={4}>
          <SearchOutlined style={{ marginRight: 8 }} />
          Search & Import Album
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Search from MusicBrainz database to auto-fill album info and track list
        </Text>
        
        <Space style={{ width: '100%', marginBottom: 16 }} wrap>
          <Input
            placeholder="Album name..."
            value={searchAlbum}
            onChange={(e) => setSearchAlbum(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
          />
          <Input
            placeholder="Artist name..."
            value={searchArtist}
            onChange={(e) => setSearchArtist(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
          />
          <Button 
            type="primary" 
            onClick={handleSearch} 
            loading={searching}
            icon={<SearchOutlined />}
          >
            Search
          </Button>
        </Space>

        {/* Search Results */}
        {searching && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Spin tip="Searching..." />
          </div>
        )}
        
        {searchResults.length > 0 && (
          <List
            size="small"
            bordered
            dataSource={searchResults}
            style={{ maxHeight: 300, overflow: 'auto' }}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    type="link" 
                    size="small"
                    loading={importing}
                    onClick={() => handleImportAlbum(item.mbid)}
                  >
                    Import
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <span>
                      {item.title} 
                      {item.date && <Text type="secondary"> ({item.date.substring(0, 4)})</Text>}
                    </span>
                  }
                  description={
                    <span>
                      {item.artistName}
                      {item.trackCount && <Text type="secondary"> · {item.trackCount} tracks</Text>}
                      {item.type && <Text type="secondary"> · {item.type}</Text>}
                      {item.country && <Text type="secondary"> · {item.country}</Text>}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
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
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: '8px 0' }} />
                  <Button 
                    type="text" 
                    icon={<PlusOutlined />} 
                    onClick={() => setGenreModalVisible(true)}
                    style={{ width: '100%' }}
                  >
                    Add New Genre
                  </Button>
                </>
              )}
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
                  <Space style={{ width: '100%' }} direction="vertical">
                    <Button 
                      type="dashed" 
                      onClick={() => add()} 
                      icon={<PlusOutlined />}
                      style={{ width: '100%' }}
                    >
                      Add Track
                    </Button>
                    <Button 
                      onClick={() => setBatchTrackModalVisible(true)}
                      style={{ width: '100%' }}
                    >
                      Batch Import Tracks (Paste Text)
                    </Button>
                  </Space>
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

      {/* Add Genre Modal */}
      <Modal
        title="Add New Genre"
        open={genreModalVisible}
        onCancel={() => setGenreModalVisible(false)}
        footer={null}
      >
        <Form form={genreForm} layout="vertical" onFinish={handleAddGenre}>
          <Form.Item
            name="name"
            label="Genre Name"
            rules={[{ required: true, message: 'Please enter genre name' }]}
          >
            <Input placeholder="e.g. Symphonic Prog" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Genre description..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={genreLoading} block>
              Create Genre
            </Button>
          </Form.Item>
        </Form>
      </Modal>

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

      {/* Batch Track Import Modal */}
      <Modal
        title="Batch Import Tracks"
        open={batchTrackModalVisible}
        onCancel={() => setBatchTrackModalVisible(false)}
        onOk={handleBatchTrackImport}
        okText="Import"
        width={600}
      >
        <p style={{ marginBottom: 16, color: '#666' }}>
          Paste your track list below. Each track on a new line.<br />
          Supported formats:
        </p>
        <ul style={{ marginBottom: 16, color: '#666', fontSize: '13px' }}>
          <li>Track Name</li>
          <li>1. Track Name</li>
          <li>Track Name 3:45</li>
          <li>1. Track Name 3:45</li>
        </ul>
        <TextArea
          rows={10}
          value={batchTrackText}
          onChange={(e) => setBatchTrackText(e.target.value)}
          placeholder={`Example:
1. Intro 1:23
2. First Song 4:56
3. Second Song 5:12
4. Outro 2:34`}
        />
      </Modal>
    </div>
  );
};

export default AddAlbum;
