import { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Card, Typography, message, Select, 
  InputNumber, Space, Divider, Modal, Alert, Spin, Tabs, Upload
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, SearchOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { albumsApi } from '../api/albums';
import { artistsApi } from '../api/artists';
import { genresApi } from '../api/genres';
import { importApi } from '../api/import';
import { filesApi } from '../api/files';
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
  const [coverUploading, setCoverUploading] = useState(false);
  
  // MusicBrainz search states
  const [searchAlbum, setSearchAlbum] = useState('');
  const [searchArtist, setSearchArtist] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const coverPreviewUrl = Form.useWatch('coverUrl', form);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!isAuthenticated) {
      message.info('请先登录');
      navigate('/login');
      return;
    }
    loadData();
  }, [authLoading, isAuthenticated]);

  const loadData = async () => {
    try {
      const [artistsRes, genresRes] = await Promise.all([
        artistsApi.getAll(),
        genresApi.getAll(),
      ]);
      setArtists(artistsRes.data);
      setGenres(genresRes.data);
    } catch (error) {
      message.error('加载数据失败');
    }
  };

  // Search albums from MusicBrainz
  const handleSearch = async () => {
    if (!searchAlbum.trim() && !searchArtist.trim()) {
      message.warning('请输入专辑名或艺术家名');
      return;
    }

    setSearching(true);
    setSearchResults([]);
    try {
      const response = await importApi.searchAlbums(searchAlbum, searchArtist, 15);
      setSearchResults(response.data.results || []);
      if (response.data.results?.length === 0) {
        message.info('未找到专辑，请尝试其他关键词。');
      }
    } catch (error) {
      message.error(error.response?.data?.error || '搜索失败');
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

      message.success(`已导入“${data.title}”，共 ${data.trackCount} 首曲目！`);
      setSearchResults([]);
      setSearchAlbum('');
      setSearchArtist('');
    } catch (error) {
      message.error(error.response?.data?.error || '导入专辑失败');
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
      message.success('艺术家创建成功！');
      setArtists([...artists, response.data]);
      form.setFieldValue('artistId', response.data.id);
      setImportedArtist(null);
    } catch (error) {
      message.error(error.response?.data?.error || '创建艺术家失败');
    } finally {
      setArtistLoading(false);
    }
  };

  const resolveCoverUrl = (url) => {
    if (!url) return '';
    return url.startsWith('/api') ? new URL(url, window.location.origin).toString() : url;
  };

  const handleCoverUpload = async (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('仅支持图片文件！');
      return false;
    }

    const isLt8M = file.size / 1024 / 1024 < 8;
    if (!isLt8M) {
      message.error('图片需小于 8MB！');
      return false;
    }

    setCoverUploading(true);
    try {
      const response = await filesApi.uploadAlbumCover(file);
      const newCoverUrl = response.data.url;
      form.setFieldValue('coverUrl', newCoverUrl);
      message.success('封面上传成功！');
    } catch (error) {
      message.error(error.response?.data?.error || '上传封面失败');
    } finally {
      setCoverUploading(false);
    }

    return false;
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Filter out empty tracks
      const validTracks = values.tracks?.filter(track => track.title && track.title.trim()) || [];
      
      const albumData = {
        title: values.title?.trim(),
        artistId: values.artistId,
        releaseYear: values.releaseYear || null,
        coverUrl: values.coverUrl?.trim() || null,
        description: values.description?.trim() || null,
        genreIds: values.genreIds && values.genreIds.length > 0 ? values.genreIds : null,
        tracks: validTracks.length > 0 ? validTracks.map((track, index) => ({
          trackNumber: index + 1,
          title: track.title.trim(),
          duration: track.minutes ? track.minutes * 60 + (track.seconds || 0) : null,
        })) : null,
      };

      console.log('提交专辑数据:', albumData);
      const response = await albumsApi.create(albumData);
      message.success('专辑创建成功！');
      navigate(`/music/albums/${response.data.id}`);
    } catch (error) {
      console.error('创建专辑出错:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          '创建专辑失败';
      
      if (error.response?.status === 401) {
        message.warning('登入已過期，請重新登入');
        navigate('/login');
      } else if (error.response?.status === 403) {
        message.error(error.response?.data?.error || '權限不足，無法建立專輯');
      } else {
        message.error(`创建专辑失败：${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddArtist = async (values) => {
    setArtistLoading(true);
    try {
      const response = await artistsApi.create(values);
      message.success('艺术家创建成功！');
      setArtists([...artists, response.data]);
      form.setFieldValue('artistId', response.data.id);
      setArtistModalVisible(false);
      artistForm.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || '创建艺术家失败');
    } finally {
      setArtistLoading(false);
    }
  };

  const handleAddGenre = async (values) => {
    setGenreLoading(true);
    try {
      const response = await genresApi.create(values);
      message.success('风格创建成功！');
      setGenres([...genres, response.data]);
      // Add to current selection
      const currentGenres = form.getFieldValue('genreIds') || [];
      form.setFieldValue('genreIds', [...currentGenres, response.data.id]);
      setGenreModalVisible(false);
      genreForm.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || '创建风格失败');
    } finally {
      setGenreLoading(false);
    }
  };

  // Parse batch track text and fill form
  const handleBatchTrackImport = () => {
    if (!batchTrackText.trim()) {
      message.warning('请输入曲目列表');
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
      message.success(`已导入 ${tracks.length} 首曲目！`);
      setBatchTrackModalVisible(false);
      setBatchTrackText('');
    } else {
      message.warning('未找到有效曲目');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>添加新专辑</Title>

      {/* Search and Import from MusicBrainz */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={4}>
          <SearchOutlined style={{ marginRight: 8 }} />
          搜索并导入专辑
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          从 MusicBrainz 搜索，自动填充专辑信息和曲目列表
        </Text>
        
        <Space style={{ width: '100%', marginBottom: 16 }} wrap>
          <Input
            placeholder="专辑名称..."
            value={searchAlbum}
            onChange={(e) => setSearchAlbum(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
          />
          <Input
            placeholder="艺术家名称..."
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
            搜索
          </Button>
        </Space>

        {/* Search Results */}
        {searching && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Spin tip="搜索中..." />
          </div>
        )}
        
        {searchResults.length > 0 && (
          <div style={{ maxHeight: 300, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 6 }}>
            {searchResults.map((item, index) => (
              <div
                key={item.mbid}
                style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderBottom: index === searchResults.length - 1 ? 'none' : '1px solid #f0f0f0' }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>
                    {item.title}
                    {item.date && <Text type="secondary"> ({item.date.substring(0, 4)})</Text>}
                  </div>
                  <div>
                    <Text>
                      {item.artistName}
                    </Text>
                    {item.trackCount && <Text type="secondary"> · {item.trackCount} 首</Text>}
                    {item.type && <Text type="secondary"> · {item.type}</Text>}
                    {item.country && <Text type="secondary"> · {item.country}</Text>}
                  </div>
                </div>
                <Button 
                  type="link" 
                  size="small"
                  loading={importing}
                  onClick={() => handleImportAlbum(item.mbid)}
                >
                  导入
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Imported Artist Alert */}
      {importedArtist && (
        <Alert
          message="导入的艺术家"
          description={
            <div>
              <Text>导入的艺术家：<strong>{importedArtist.name}</strong></Text>
              <br />
              <Button 
                type="link" 
                onClick={handleCreateImportedArtist}
                loading={artistLoading}
                style={{ padding: 0, marginTop: 8 }}
              >
                点击创建此艺术家
              </Button>
              <Text type="secondary"> 或在下方选择已有艺术家</Text>
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
          <Title level={4}>基本信息</Title>
          
          <Form.Item
            name="title"
            label="专辑名称"
            rules={[{ required: true, message: '请输入专辑名称' }]}
          >
            <Input placeholder="请输入专辑名称" />
          </Form.Item>

          <Form.Item
            name="artistId"
            label="艺术家"
            rules={[{ required: true, message: '请选择艺术家' }]}
          >
            <Select
              placeholder="选择艺术家"
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
                    新增艺术家
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

          <Form.Item name="releaseYear" label="发行年份">
            <InputNumber 
              min={1900} 
              max={new Date().getFullYear()} 
              placeholder="例如 1973" 
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="genreIds" label="风格">
            <Select
              mode="multiple"
              placeholder="选择风格"
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
                    新增风格
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

          <Form.Item label="封面图片">
            <Space align="start" style={{ width: '100%' }} wrap>
              <Upload
                name="cover"
                listType="picture-card"
                showUploadList={false}
                beforeUpload={handleCoverUpload}
                accept="image/*"
              >
                {coverPreviewUrl ? (
                  <img 
                    src={resolveCoverUrl(coverPreviewUrl)} 
                    alt="cover" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <div>
                    {coverUploading ? <LoadingOutlined /> : <PlusOutlined />}
                    <div style={{ marginTop: 8 }}>上传</div>
                  </div>
                )}
              </Upload>
              <div style={{ flex: 1, minWidth: 200 }}>
                <Form.Item name="coverUrl" noStyle>
                  <Input placeholder="https://example.com/cover.jpg" />
                </Form.Item>
                <Text type="secondary" style={{ display: 'block', marginTop: 6 }}>
                  可直接上传封面，或粘贴图片 URL
                </Text>
              </div>
            </Space>
          </Form.Item>

          <Form.Item name="description" label="简介">
            <TextArea rows={4} placeholder="专辑简介..." />
          </Form.Item>

          {/* 曲目列表 */}
          <Divider />
          <Title level={4}>曲目列表</Title>

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
                      rules={[{ required: true, message: '请输入曲目名称' }]}
                      style={{ marginBottom: 0, flex: 1, minWidth: 200 }}
                    >
                      <Input placeholder="曲目名称" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'minutes']}
                      style={{ marginBottom: 0, width: 70 }}
                    >
                      <InputNumber min={0} placeholder="分" />
                    </Form.Item>
                    <span>:</span>
                    <Form.Item
                      {...restField}
                      name={[name, 'seconds']}
                      style={{ marginBottom: 0, width: 70 }}
                    >
                      <InputNumber min={0} max={59} placeholder="秒" />
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
                      添加曲目
                    </Button>
                    <Button 
                      onClick={() => setBatchTrackModalVisible(true)}
                      style={{ width: '100%' }}
                    >
                      批量导入曲目（粘贴文本）
                    </Button>
                  </Space>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large" block>
              创建专辑
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Add Genre Modal */}
      <Modal
        title="新增风格"
        open={genreModalVisible}
        onCancel={() => setGenreModalVisible(false)}
        footer={null}
      >
        <Form form={genreForm} layout="vertical" onFinish={handleAddGenre}>
          <Form.Item
            name="name"
            label="风格名称"
            rules={[{ required: true, message: '请输入风格名称' }]}
          >
            <Input placeholder="例如 Symphonic Prog" />
          </Form.Item>
          <Form.Item name="description" label="简介">
            <TextArea rows={3} placeholder="风格简介..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={genreLoading} block>
              创建风格
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Artist Modal */}
      <Modal
        title="新增艺术家"
        open={artistModalVisible}
        onCancel={() => setArtistModalVisible(false)}
        footer={null}
      >
        <Form form={artistForm} layout="vertical" onFinish={handleAddArtist}>
          <Form.Item
            name="name"
            label="艺术家名称"
            rules={[{ required: true, message: '请输入艺术家名称' }]}
          >
            <Input placeholder="e.g. Pink Floyd" />
          </Form.Item>
          <Form.Item name="country" label="国家/地区">
            <Select 
              placeholder="选择国家/地区" 
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
          <Form.Item name="formedYear" label="成立年份">
            <InputNumber 
              min={1900} 
              max={new Date().getFullYear()} 
              placeholder="例如 1965"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="description" label="简介">
            <TextArea rows={3} placeholder="艺术家简介..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={artistLoading} block>
              创建艺术家
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Batch Track Import Modal */}
      <Modal
        title="批量导入曲目"
        open={batchTrackModalVisible}
        onCancel={() => setBatchTrackModalVisible(false)}
        onOk={handleBatchTrackImport}
        okText="导入"
        width={600}
      >
        <p style={{ marginBottom: 16, color: '#666' }}>
          请将曲目列表粘贴到下方，每行一首。<br />
          支持的格式：
        </p>
        <ul style={{ marginBottom: 16, color: '#666', fontSize: '13px' }}>
          <li>曲目名称</li>
          <li>1. 曲目名称</li>
          <li>曲目名称 3:45</li>
          <li>1. 曲目名称 3:45</li>
        </ul>
        <TextArea
          rows={10}
          value={batchTrackText}
          onChange={(e) => setBatchTrackText(e.target.value)}
          placeholder={`示例：
1. 序曲 1:23
2. 第一首 4:56
3. 第二首 5:12
4. 尾声 2:34`}
        />
      </Modal>
    </div>
  );
};

export default AddAlbum;
