import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserSession } from './user-session';

// Ключи для хранения лайков и избранного по пользователям
const getLikedPostsKey = (userId: number) => `liked-posts-${userId}`;
const getFavoritePostsKey = (userId: number) => `favorite-posts-${userId}`;

// Получить ID текущего пользователя
const getCurrentUserId = async (): Promise<number | null> => {
  try {
    const session = await getUserSession();
    return session?.id || null;
  } catch (error) {
    console.error('❌ Ошибка получения ID пользователя:', error);
    return null;
  }
};

// Проверить авторизацию пользователя
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    const session = await getUserSession();
    return !!session?.id;
  } catch (error) {
    console.error('❌ Ошибка проверки авторизации:', error);
    return false;
  }
}

// Получить лайкнутые посты пользователя
export async function getLikedPosts(): Promise<string[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.log('❌ Нет пользователя для получения лайков');
      return [];
    }

    const likedPostsData = await AsyncStorage.getItem(getLikedPostsKey(userId));
    return likedPostsData ? JSON.parse(likedPostsData) : [];
  } catch (error) {
    console.error('❌ Ошибка получения лайкнутых постов:', error);
    return [];
  }
}

// Получить избранные посты пользователя
export async function getFavoritePosts(): Promise<string[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.log('❌ Нет пользователя для получения избранного');
      return [];
    }

    const favoritePostsData = await AsyncStorage.getItem(getFavoritePostsKey(userId));
    return favoritePostsData ? JSON.parse(favoritePostsData) : [];
  } catch (error) {
    console.error('❌ Ошибка получения избранных постов:', error);
    return [];
  }
}

// Добавить/удалить лайк
export async function toggleLike(postId: string): Promise<{success: boolean; requiresAuth: boolean}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.log('❌ Нет пользователя для лайка');
      return { success: false, requiresAuth: true };
    }

    const currentLiked = await getLikedPosts();
    const isLiked = currentLiked.includes(postId);
    
    let newLiked: string[];
    if (isLiked) {
      // Удаляем лайк
      newLiked = currentLiked.filter(id => id !== postId);
      console.log(`👎 Пользователь ${userId} убрал лайк с поста ${postId}`);
    } else {
      // Добавляем лайк
      newLiked = [...currentLiked, postId];
      console.log(`👍 Пользователь ${userId} лайкнул пост ${postId}`);
    }

    // Сохраняем в AsyncStorage под ключом пользователя
    await AsyncStorage.setItem(getLikedPostsKey(userId), JSON.stringify(newLiked));
    console.log('✅ Лайки сохранены для пользователя:', userId);
    
    return { success: true, requiresAuth: false };
  } catch (error) {
    console.error('❌ Ошибка переключения лайка:', error);
    return { success: false, requiresAuth: false };
  }
}

// Добавить/удалить из избранного
export async function toggleFavorite(postId: string): Promise<{success: boolean; requiresAuth: boolean}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.log('❌ Нет пользователя для избранного');
      return { success: false, requiresAuth: true };
    }

    const currentFavorites = await getFavoritePosts();
    const isFavorite = currentFavorites.includes(postId);
    
    let newFavorites: string[];
    if (isFavorite) {
      // Удаляем из избранного
      newFavorites = currentFavorites.filter(id => id !== postId);
      console.log(`📕 Пользователь ${userId} убрал из избранного пост ${postId}`);
    } else {
      // Добавляем в избранное
      newFavorites = [...currentFavorites, postId];
      console.log(`📗 Пользователь ${userId} добавил в избранное пост ${postId}`);
    }

    // Сохраняем в AsyncStorage под ключом пользователя
    await AsyncStorage.setItem(getFavoritePostsKey(userId), JSON.stringify(newFavorites));
    console.log('✅ Избранное сохранено для пользователя:', userId);
    
    return { success: true, requiresAuth: false };
  } catch (error) {
    console.error('❌ Ошибка переключения избранного:', error);
    return { success: false, requiresAuth: false };
  }
}

// Проверить, лайкнут ли пост
export async function isPostLiked(postId: string): Promise<boolean> {
  try {
    const likedPosts = await getLikedPosts();
    return likedPosts.includes(postId);
  } catch (error) {
    console.error('❌ Ошибка проверки лайка:', error);
    return false;
  }
}

// Проверить, в избранном ли пост
export async function isPostFavorite(postId: string): Promise<boolean> {
  try {
    const favoritePosts = await getFavoritePosts();
    return favoritePosts.includes(postId);
  } catch (error) {
    console.error('❌ Ошибка проверки избранного:', error);
    return false;
  }
}

// Получить количество лайков пользователя
export async function getLikedPostsCount(): Promise<number> {
  try {
    const likedPosts = await getLikedPosts();
    return likedPosts.length;
  } catch (error) {
    console.error('❌ Ошибка получения количества лайков:', error);
    return 0;
  }
}

// Получить количество избранных постов
export async function getFavoritePostsCount(): Promise<number> {
  try {
    const favoritePosts = await getFavoritePosts();
    return favoritePosts.length;
  } catch (error) {
    console.error('❌ Ошибка получения количества избранных:', error);
    return 0;
  }
}

// Очистить лайки и избранное пользователя (при удалении аккаунта)
export async function clearUserLikesAndFavorites(userId: number): Promise<void> {
  try {
    await AsyncStorage.removeItem(getLikedPostsKey(userId));
    await AsyncStorage.removeItem(getFavoritePostsKey(userId));
    console.log(`🧹 Лайки и избранное пользователя ${userId} очищены`);
  } catch (error) {
    console.error('❌ Ошибка очистки лайков и избранного:', error);
    throw error;
  }
}