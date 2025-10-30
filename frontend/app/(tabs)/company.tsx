import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { databaseService, formatCompactNumber, type Post } from '@/constants/content';
import {
  isPostFavorite,
  isPostLiked,
  isUserAuthenticated,
  toggleFavorite,
  toggleLike
} from '@/lib/likes-favorites';
import { triggerMapRoute, triggerMapSearch } from '@/lib/map-search';

export default function CompanyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAuthModalVisible, setAuthModalVisible] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isGalleryVisible, setGalleryVisible] = useState(false);

  // Загрузка данных поста
  useEffect(() => {
    loadPostData();
  }, [id]);

  const loadPostData = async () => {
    if (!id) {
      setError('ID поста не указан');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`📡 Загрузка поста ${id}...`);
      const postData = await databaseService.getPostById(id);
      
      if (!postData) {
        setError('Пост не найден');
        setPost(null);
        return;
      }

      setPost(postData);
      
      // Загружаем состояния лайков и избранного
      const [liked, favorite] = await Promise.all([
        isPostLiked(id),
        isPostFavorite(id)
      ]);
      
      setIsLiked(liked);
      setIsFavorite(favorite);
      
      console.log('✅ Данные поста загружены');
    } catch (error) {
      console.error('❌ Ошибка загрузки поста:', error);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  // Проверить авторизацию перед действием
  const requireAuth = async (action: () => Promise<void>): Promise<boolean> => {
    const isAuthenticated = await isUserAuthenticated();
    if (!isAuthenticated) {
      setAuthModalVisible(true);
      return false;
    }
    await action();
    return true;
  };

  // Лайк/анлайк поста
  const handleLike = async () => {
    if (!post) return;

    const success = await requireAuth(async () => {
      try {
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);

        // Обновляем счетчик лайков локально
        setPost(prev => prev ? {
          ...prev,
          likes: newLikedState ? prev.likes + 1 : Math.max(0, prev.likes - 1)
        } : null);

        // Сохраняем в хранилище
        const result = await toggleLike(post.id);
        if (!result.success) {
          throw new Error('Failed to toggle like');
        }
      } catch (error) {
        console.error('❌ Ошибка при лайке:', error);
        // Откатываем изменения в случае ошибки
        setIsLiked(!isLiked);
        throw error;
      }
    });

    return success;
  };

  // Добавить/удалить из избранного
  const handleFavorite = async () => {
    if (!post) return;

    const success = await requireAuth(async () => {
      try {
        const newFavoriteState = !isFavorite;
        setIsFavorite(newFavoriteState);

        // Сохраняем в хранилище
        const result = await toggleFavorite(post.id);
        if (!result.success) {
          throw new Error('Failed to toggle favorite');
        }
      } catch (error) {
        console.error('❌ Ошибка при избранном:', error);
        // Откатываем изменения в случае ошибки
        setIsFavorite(!isFavorite);
        throw error;
      }
    });

    return success;
  };

  const openInMap = () => {
    if (!post) return;
    router.push('/map');
    triggerMapSearch(post.address);
  };

  const buildRoute = () => {
    if (!post) return;
    router.push('/map');
    triggerMapRoute(post.address);
  };

  const handleOpenAuth = () => {
    setAuthModalVisible(true);
  };

  const handleCloseAuth = () => {
    setAuthModalVisible(false);
  };

  const handleNavigateToAuth = () => {
    setAuthModalVisible(false);
    router.push('/login');
  };

  const openGallery = (index: number) => {
    setActiveImageIndex(index);
    setGalleryVisible(true);
  };

  const closeGallery = () => {
    setGalleryVisible(false);
  };

  const navigateGallery = (direction: 'prev' | 'next') => {
    if (!post?.gallery) return;
    
    const newIndex = direction === 'next' 
      ? (activeImageIndex + 1) % post.gallery.length
      : (activeImageIndex - 1 + post.gallery.length) % post.gallery.length;
    
    setActiveImageIndex(newIndex);
  };

  // Безопасный доступ к массивам
  const galleryImages = useMemo(() => post?.gallery || [], [post?.gallery]);
  const postTags = useMemo(() => post?.tags || [], [post?.tags]);
  const postReviews = useMemo(() => post?.reviews || [], [post?.reviews]);
  const workingHours = useMemo(() => post?.workingHours || [], [post?.workingHours]);
  const contactInfo = useMemo(() => post?.contact || [], [post?.contact]);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Ionicons name="business-outline" size={48} color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка информации о месте...</Text>
      </ThemedView>
    );
  }

  if (error || !post) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <ThemedText type="title" style={styles.errorTitle}>
          {error || 'Пост не найден'}
        </ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadPostData}>
          <Text style={styles.retryButtonText}>Попробовать снова</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: post.place,
          headerTransparent: true,
          headerTintColor: '#0f172a',
        }}
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Основное изображение */}
        <TouchableOpacity 
          style={styles.mainImageContainer}
          onPress={() => openGallery(0)}
          activeOpacity={0.9}
        >
          <Image source={{ uri: post.image }} style={styles.mainImage} />
          <View style={styles.imageOverlay}>
            {galleryImages.length > 1 && (
              <View style={styles.galleryBadge}>
                <Ionicons name="images-outline" size={16} color="#fff" />
                <Text style={styles.galleryBadgeText}>{galleryImages.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Информация о месте */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <ThemedText type="title" style={styles.title}>
                {post.place}
              </ThemedText>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={18} color="#FFB800" />
                <Text style={styles.ratingText}>{post.rating.toFixed(1)}</Text>
              </View>
            </View>
            
            <View style={styles.authorRow}>
              <Image source={{ uri: post.userAvatar }} style={styles.authorAvatar} />
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{post.user}</Text>
                <Text style={styles.authorHandle}>@{post.userHandle}</Text>
              </View>
            </View>

            <Text style={styles.bio}>{post.bio}</Text>

            <TouchableOpacity style={styles.addressRow} onPress={openInMap}>
              <Ionicons name="location-outline" size={18} color="#2563eb" />
              <Text style={styles.addressText}>{post.address}</Text>
            </TouchableOpacity>
          </View>

          {/* Теги */}
          {postTags.length > 0 && (
            <View style={styles.tagsSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tagsContainer}>
                  {postTags.map((tag, index) => (
                    <View key={`${tag}-${index}`} style={styles.tagChip}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Действия */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={isLiked ? "#FF2D55" : "#1C1C1E"} 
              />
              <Text style={[
                styles.actionText,
                { color: isLiked ? "#FF2D55" : "#1C1C1E" }
              ]}>
                {formatCompactNumber(post.likes)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={buildRoute}>
              <Ionicons name="navigate-outline" size={24} color="#1C1C1E" />
              <Text style={styles.actionText}>Маршрут</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={openInMap}>
              <Ionicons name="map-outline" size={24} color="#1C1C1E" />
              <Text style={styles.actionText}>На карте</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.favoriteButton]} 
              onPress={handleFavorite}
            >
              <Ionicons 
                name={isFavorite ? "bookmark" : "bookmark-outline"} 
                size={24} 
                color={isFavorite ? "#007AFF" : "#1C1C1E"} 
              />
            </TouchableOpacity>
          </View>

          {/* Галерея */}
          {galleryImages.length > 1 && (
            <View style={styles.gallerySection}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Галерея
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.gallery}>
                  {galleryImages.slice(1).map((image, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.galleryItem}
                      onPress={() => openGallery(index + 1)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: image }} style={styles.galleryImage} />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Время работы */}
          {workingHours.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Время работы
              </ThemedText>
              <View style={styles.hoursList}>
                {workingHours.map((slot, index) => (
                  <View key={index} style={styles.hoursRow}>
                    <Text style={styles.hoursLabel}>{slot.label}</Text>
                    <Text style={styles.hoursValue}>{slot.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Контакты */}
          {contactInfo.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Контакты
              </ThemedText>
              <View style={styles.contactsList}>
                {contactInfo.map((contact, index) => (
                  <TouchableOpacity key={index} style={styles.contactRow}>
                    <Ionicons name={contact.icon} size={18} color="#2563eb" />
                    <Text style={styles.contactText}>{contact.value}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Отзывы */}
          {postReviews.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Отзывы ({postReviews.length})
              </ThemedText>
              <View style={styles.reviewsList}>
                {postReviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewAuthor}>{review.author}</Text>
                      <View style={styles.reviewRating}>
                        <Ionicons name="star" size={14} color="#FFB800" />
                        <Text style={styles.reviewRatingText}>{review.rating.toFixed(1)}</Text>
                      </View>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Модальное окно авторизации */}
      <Modal visible={isAuthModalVisible} transparent animationType="fade" onRequestClose={handleCloseAuth}>
        <Pressable style={styles.modalOverlay} onPress={handleCloseAuth}>
          <Pressable style={styles.authModalCard} onPress={event => event.stopPropagation()}>
            <View style={styles.authModalIcon}>
              <Ionicons name="lock-closed" size={32} color="#007AFF" />
            </View>
            <Text style={styles.authModalTitle}>Требуется авторизация</Text>
            <Text style={styles.authModalText}>
              Чтобы лайкать посты и добавлять их в избранное, пожалуйста, войдите в свой аккаунт
            </Text>
            <View style={styles.authModalButtons}>
              <TouchableOpacity 
                style={styles.authModalButtonSecondary}
                onPress={handleCloseAuth}
              >
                <Text style={styles.authModalButtonSecondaryText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.authModalButtonPrimary}
                onPress={handleNavigateToAuth}
              >
                <Text style={styles.authModalButtonPrimaryText}>Войти</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Галерея */}
      <Modal visible={isGalleryVisible} transparent animationType="fade" onRequestClose={closeGallery}>
        <Pressable style={styles.galleryOverlay} onPress={closeGallery}>
          <Pressable style={styles.galleryContent} onPress={event => event.stopPropagation()}>
            <Image 
              source={{ uri: galleryImages[activeImageIndex] }} 
              style={styles.galleryFullImage}
            />
            
            {galleryImages.length > 1 && (
              <>
                <TouchableOpacity 
                  style={[styles.galleryNavButton, styles.galleryNavButtonLeft]}
                  onPress={() => navigateGallery('prev')}
                >
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.galleryNavButton, styles.galleryNavButtonRight]}
                  onPress={() => navigateGallery('next')}
                >
                  <Ionicons name="chevron-forward" size={28} color="#fff" />
                </TouchableOpacity>
                
                <View style={styles.galleryIndicator}>
                  <Text style={styles.galleryIndicatorText}>
                    {activeImageIndex + 1} / {galleryImages.length}
                  </Text>
                </View>
              </>
            )}
            
            <TouchableOpacity style={styles.galleryCloseButton} onPress={closeGallery}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  mainImageContainer: {
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: 300,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 16,
  },
  galleryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  galleryBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    gap: 24,
  },
  header: {
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 24,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 184, 0, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B45309',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  authorHandle: {
    fontSize: 14,
    color: '#64748b',
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  tagsSection: {
    gap: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
  },
  favoriteButton: {
    marginLeft: 'auto',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  gallerySection: {
    gap: 12,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#0f172a',
  },
  gallery: {
    flexDirection: 'row',
    gap: 12,
  },
  galleryItem: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  hoursList: {
    gap: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.3)',
  },
  hoursLabel: {
    fontSize: 15,
    color: '#475569',
  },
  hoursValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  contactsList: {
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  contactText: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '500',
  },
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B45309',
  },
  reviewComment: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1f2937',
  },
  reviewDate: {
    fontSize: 13,
    color: '#94a3b8',
  },
  // Стили для модального окна авторизации
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 16, 26, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  authModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0b101a',
    shadowOpacity: 0.25,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 18 },
    elevation: 16,
  },
  authModalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  authModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 12,
  },
  authModalText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  authModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  authModalButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    alignItems: 'center',
  },
  authModalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  authModalButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  authModalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Стили для галереи
  galleryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryFullImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
  galleryNavButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryNavButtonLeft: {
    left: 20,
  },
  galleryNavButtonRight: {
    right: 20,
  },
  galleryIndicator: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  galleryIndicatorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  galleryCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});