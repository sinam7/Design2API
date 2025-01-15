'use client';

import { useEffect, useState, useCallback } from 'react';
import { figmaClient } from '@/lib/figma/client';
import { FigmaNode } from '@/lib/figma/types';
import Link from 'next/link';
import Image from 'next/image';
import { SchemaResponse } from '@/lib/types/schema';

// 이미지 캐시 인터페이스
interface ImageCache {
  [key: string]: {
    url: string;
    timestamp: number;
  };
}

// 스키마 캐시 인터페이스
interface SchemaCache {
  [key: string]: {
    schema: SchemaResponse;
    timestamp: number;
  };
}

const CACHE_DURATION = 1000 * 60 * 60; // 1시간

// 타입 정의 추가
interface FigmaPageData {
  document: {
    children: FigmaPage[];
  };
}

interface FigmaPage {
  id: string;
  name: string;
  children?: FigmaNode[];
}

export default function Home() {
  const [data, setData] = useState<FigmaPageData | null>(null);
  const [selectedNode, setSelectedNode] = useState<FigmaNode | null>(null);
  const [nodeImage, setNodeImage] = useState<string | null>(null);
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [inferenceLoading, setInferenceLoading] = useState<boolean>(false);
  const [imageCache, setImageCache] = useState<ImageCache>({});
  const [schemaCache, setSchemaCache] = useState<SchemaCache>({});
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [settings, setSettings] = useState<{
    figmaAccessToken: string;
    figmaFileId: string;
    openaiApiKey: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFigmaData = useCallback(async () => {
    if (!settings) return;
    
    try {
      setError(null);
      const fileData = await figmaClient.getFile();
      setData(fileData);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to load Figma data:', error);
        if (error.message.includes('401')) {
          setError('Figma Access Token이 올바르지 않습니다. 설정에서 확인해주세요.');
        } else if (error.message.includes('404')) {
          setError('Figma 파일을 찾을 수 없습니다. 파일 ID가 올바른지 확인해주세요.');
        } else {
          setError('Figma 파일을 불러오는데 실패했습니다. 설정을 확인해주세요.');
        }
        
        setData(null);
      }
    }
  }, [settings]);

  useEffect(() => {
    if (settings) {
      figmaClient.setCredentials(settings.figmaAccessToken, settings.figmaFileId);
      loadFigmaData();
    }
  }, [settings, loadFigmaData]);

  useEffect(() => {
    const savedSettings = localStorage.getItem('design2api_settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      figmaClient.setCredentials(parsedSettings.figmaAccessToken, parsedSettings.figmaFileId);
    }
    
    // 이미지 캐시 로드
    const loadImageCache = (key: string): ImageCache => {
      const cachedData = localStorage.getItem(key);
      if (cachedData) {
        const parsedCache = JSON.parse(cachedData);
        const now = Date.now();
        const validCache = Object.entries(parsedCache).reduce((acc, [key, value]) => {
          const cacheValue = value as { url: string; timestamp: number };
          if (now - cacheValue.timestamp < CACHE_DURATION) {
            acc[key] = {
              url: cacheValue.url,
              timestamp: cacheValue.timestamp
            };
          }
          return acc;
        }, {} as ImageCache);
        return validCache;
      }
      return {};
    };

    // 스키마 캐시 로드
    const loadSchemaCache = (key: string): SchemaCache => {
      const cachedData = localStorage.getItem(key);
      if (cachedData) {
        const parsedCache = JSON.parse(cachedData);
        const now = Date.now();
        const validCache = Object.entries(parsedCache).reduce((acc, [key, value]) => {
          const cacheValue = value as { schema: SchemaResponse; timestamp: number };
          if (now - cacheValue.timestamp < CACHE_DURATION) {
            acc[key] = {
              schema: cacheValue.schema,
              timestamp: cacheValue.timestamp
            };
          }
          return acc;
        }, {} as SchemaCache);
        return validCache;
      }
      return {};
    };

    setImageCache(loadImageCache('figmaImageCache'));
    setSchemaCache(loadSchemaCache('figmaSchemaCache'));
  }, []);

  // 캐시 저장
  useEffect(() => {
    if (Object.keys(imageCache).length > 0) {
      localStorage.setItem('figmaImageCache', JSON.stringify(imageCache));
    }
  }, [imageCache]);

  useEffect(() => {
    if (Object.keys(schemaCache).length > 0) {
      localStorage.setItem('figmaSchemaCache', JSON.stringify(schemaCache));
    }
  }, [schemaCache]);

  const getImageFromCache = (nodeId: string): string | null => {
    const cached = imageCache[nodeId];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.url;
    }
    return null;
  };

  const getSchemaFromCache = (nodeId: string): SchemaResponse | null => {
    const cached = schemaCache[nodeId];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.schema;
    }
    return null;
  };

  const handleNodeSelect = async (node: FigmaNode) => {
    setSelectedNode(node);
    setSchema(null);
    setLoading(true);
    
    try {
      // 이미지 캐시 확인
      const cachedImage = getImageFromCache(node.id);
      if (cachedImage) {
        setNodeImage(cachedImage);
        setLoading(false);
      } else {
        // 캐시에 없으면 새로 가져오기
        const imageUrl = await figmaClient.getImage(node.id);
        setNodeImage(imageUrl);
        
        // 캐시에 저장
        setImageCache(prev => ({
          ...prev,
          [node.id]: {
            url: imageUrl,
            timestamp: Date.now()
          }
        }));
      }

      // 스키마 캐시 확인
      const cachedSchema = getSchemaFromCache(node.id);
      if (cachedSchema) {
        setSchema(cachedSchema);
      }
    } catch (error) {
      console.error('Failed to load image:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSchema = async () => {
    if (!selectedNode || !settings) return;
    
    setInferenceLoading(true);
    setSchema(null);
    
    try {
      const response = await fetch('/api/generate-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frameName: selectedNode.name,
          components: selectedNode.children || [],
          openaiApiKey: settings.openaiApiKey,
        }),
      });

      const data = (await response.json()) as SchemaResponse;

      if (!response.ok) {
        const errorMessage = data.error || 'Schema generation failed';
        throw new Error(errorMessage);
      }

      setSchema(data);
      setSchemaCache(prev => ({
        ...prev,
        [selectedNode.id]: {
          schema: data,
          timestamp: Date.now()
        }
      }));
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to generate schema:', error);
        setError(error.message || 'API 스키마 생성에 실패했습니다.');
      }
    } finally {
      setInferenceLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Design2API</h1>
        <Link
          href="/settings"
          className="px-4 py-2 text-blue-500 hover:text-blue-600 transition-colors"
        >
          설정
        </Link>
      </div>
      
      <div className="grid grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
        {/* Figma 디자인 패널 */}
        <div className="border rounded-lg p-4 overflow-auto">
          <h2 className="text-xl font-semibold mb-2 sticky top-0 bg-white">Figma Design</h2>
          {error ? (
            <div className="text-red-500 p-4 text-center">
              {error}
            </div>
          ) : data ? (
            <div className="space-y-2">
              {data.document.children.map((page: FigmaPage) => (
                <div key={page.id}>
                  <h3 className="font-medium">{page.name}</h3>
                  <div className="pl-4">
                    {page.children?.map((frame: FigmaNode) => (
                      <button
                        key={frame.id}
                        onClick={() => handleNodeSelect(frame)}
                        className={`block text-left hover:bg-gray-100 w-full p-2 rounded ${
                          selectedNode?.id === frame.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        {frame.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              Loading...
            </div>
          )}
        </div>

        {/* 선택된 디자인 이미지 */}
        <div className="border rounded-lg p-4 flex flex-col">
          <h2 className="text-xl font-semibold mb-2">Selected Design</h2>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : nodeImage ? (
            <div className="flex items-center justify-center h-64">
              <button
                onClick={() => setShowImageModal(true)}
                className="relative group"
              >
                <Image
                  src={nodeImage}
                  alt={selectedNode?.name || 'Selected design'}
                  className="max-w-full max-h-64 object-contain cursor-pointer"
                  width={500}
                  height={300}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                  <span className="text-transparent group-hover:text-white transition-all">
                    Click to view original
                  </span>
                </div>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              Select a frame to view
            </div>
          )}
        </div>

        {/* API 스키마 결과 */}
        <div className="border rounded-lg p-4 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-2 bg-white">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Generated API Schema</h2>
              <span className="text-xs text-gray-400">gpt-4o-mini-2024-07-18</span>
            </div>
            {selectedNode && !inferenceLoading && (
              <button
                onClick={handleGenerateSchema}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                disabled={inferenceLoading}
              >
                Generate Schema
              </button>
            )}
          </div>
          
          <div className="h-[calc(100vh-16rem)] overflow-auto">
            {inferenceLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : schema ? (
              <pre className="bg-gray-50 p-4 rounded whitespace-pre-wrap">
                {JSON.stringify(schema, null, 2)}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                {selectedNode 
                  ? 'Click Generate Schema to create API schema'
                  : 'Select a frame to start'
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 이미지 모달 */}
      {showImageModal && nodeImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div 
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-4 -right-4 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100"
            >
              ✕
            </button>
            <Image
              src={nodeImage}
              alt={selectedNode?.name || 'Original design'}
              className="max-w-full max-h-[90vh] object-contain"
              width={500}
              height={300}
            />
          </div>
        </div>
      )}
    </main>
  );
}
