import { Ionicons } from '@expo/vector-icons';

export type WorkingHours = {
  label: string;
  value: string;
};

export type Review = {
  id: string;
  author: string;
  comment: string;
  rating: number;
  date: string;
};

export type ContactInfo = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export type Story = {
  id: string;
  userName: string;
  avatar: string;
  image: string;
  text: string;
  postId: string;
};

export type Post = {
  id: string;
  user: string;
  userAvatar: string;
  userHandle: string;
  place: string;
  image: string;
  gallery: string[];
  likes: number;
  totalLikes: number;
  followers: number;
  rating: number;
  tags: string[];
  bio: string;
  address: string;
  category: string;
  workingHours: WorkingHours[];
  reviews: Review[];
  contact: ContactInfo[];
};

export const formatCompactNumber = (number: number): string => {
  if (number < 1000) {
    return number.toString();
  } else if (number < 1000000) {
    return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
};

// Базовый URL для API
const API_BASE_URL = 'http://192.168.0.116:3000';

// Функции для работы с API бэкенда
export const databaseService = {
  // Получить все посты
  async getPosts(): Promise<Post[]> {
    try {
      console.log('📡 Запрос постов с бэкенда...');
      const response = await fetch(`${API_BASE_URL}/api/posts`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const posts = await response.json();
      
      // ВРЕМЕННО: Детальная проверка структуры данных
      console.log('🔍 СТРУКТУРА ДАННЫХ ОТ API:');
      if (posts.length > 0) {
        const firstPost = posts[0];
        console.log('Первый пост:', firstPost);
        console.log('Все поля первого поста:', Object.keys(firstPost));
        console.log('Есть ли поле address?', 'address' in firstPost);
        console.log('Значение address:', firstPost.address);
      }
      
      console.log('✅ Посты получены с бэкенда:', posts.length);
      return posts;
    } catch (error) {
      console.error('❌ Ошибка при загрузке постов:', error);
      throw error;
    }
  },

  // Получить все истории
  async getStories(): Promise<Story[]> {
    try {
      console.log('📡 Запрос историй с бэкенда...');
      const response = await fetch(`${API_BASE_URL}/api/stories`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const stories = await response.json();
      console.log('✅ Истории получены с бэкенда:', stories.length);
      return stories;
    } catch (error) {
      console.error('❌ Ошибка при загрузке историй:', error);
      throw error;
    }
  },

  // Получить пост по ID
  async getPostById(id: string): Promise<Post | null> {
    try {
      console.log(`📡 Запрос поста ${id} с бэкенда...`);
      const response = await fetch(`${API_BASE_URL}/api/posts/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const post = await response.json();
      console.log('✅ Пост получен с бэкенда:', post.id);
      return post;
    } catch (error) {
      console.error('❌ Ошибка при загрузке поста:', error);
      throw error;
    }
  }
};