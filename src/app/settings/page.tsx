'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Settings {
  figmaAccessToken: string;
  figmaFileId: string;
  openaiApiKey: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    figmaAccessToken: '',
    figmaFileId: '',
    openaiApiKey: '',
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 저장된 설정 불러오기
    const savedSettings = localStorage.getItem('design2api_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
    setIsSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 설정을 로컬 스토리지에 저장
      localStorage.setItem('design2api_settings', JSON.stringify(settings));
      
      // API 호출하여 서버 측 환경 변수 업데이트
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('설정 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">설정</h1>
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-600 transition-colors"
          >
            ← 메인으로 돌아가기
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="figmaAccessToken" className="block font-medium mb-1">
                Figma Access Token
              </label>
              <input
                type="password"
                id="figmaAccessToken"
                name="figmaAccessToken"
                value={settings.figmaAccessToken}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="figd_..."
                required
              />
            </div>

            <div>
              <label htmlFor="figmaFileId" className="block font-medium mb-1">
                Figma File ID
              </label>
              <input
                type="text"
                id="figmaFileId"
                name="figmaFileId"
                value={settings.figmaFileId}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="파일 URL에서 ID 복사..."
                required
              />
            </div>

            <div>
              <label htmlFor="openaiApiKey" className="block font-medium mb-1">
                OpenAI API Key
              </label>
              <input
                type="password"
                id="openaiApiKey"
                name="openaiApiKey"
                value={settings.openaiApiKey}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="sk-..."
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            {isSaved && (
              <span className="text-green-500">설정이 저장되었습니다!</span>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? '저장 중...' : '설정 저장'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
} 