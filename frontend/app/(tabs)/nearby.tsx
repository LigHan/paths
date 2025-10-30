import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
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

type NearbyPost = Post;

const categoryOptions = [
  { id: 'all', name: 'Все', icon: 'apps' as const },
  { id: 'cafe', name: 'Кафе', icon: 'cafe-outline' as const },
  { id: 'restaurant', name: 'Рестораны', icon: 'restaurant-outline' as const },
  { id: 'park', name: 'Парки', icon: 'leaf-outline' as const },
  { id: 'museum', name: 'Музеи', icon: 'school-outline' as const },
  { id: 'shop', name: 'Магазины', icon: 'cart-outline' as const },
  { id: 'entertainment', name: 'Развлечения', icon: 'game-controller-outline' as const },
];

export default function NearbyScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [posts, setPosts] = useState<NearbyPost[]>([]);
  const [visiblePosts, setVisiblePosts] = useState<NearbyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePost, setActivePost] = useState<NearbyPost | null>(null);
  const [isDetailVisible, setDetailVisible] = useState(false);
  const [postLikes, setPostLikes] = useState<Record<string, boolean>>({});
  const [postFavorites, setPostFavorites] = useState<Record<string, boolean>>({});
  const [isAuthModalVisible, setAuthModalVisible] = useState(false);

  // Загрузка данных из бекенда
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📥 Загрузка данных для Nearby...');
      
      const postsData = await databaseService.getPosts();
      console.log('📋 Загруженные посты с категориями:', postsData.map(p => ({ id: p.id, category: p.category })));
      
      setPosts(postsData);
      setVisiblePosts(postsData);
      
      console.log('✅ Данные загружены для Nearby:', postsData.length);
    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  // Загружаем состояния лайков и избранного
  useEffect(() => {
    const loadPostStates = async () => {
      if (posts.length === 0) return;
      
      const newPostLikes: Record<string, boolean> = {};
      const newPostFavorites: Record<string, boolean> = {};

      for (const post of posts) {
        newPostLikes[post.id] = await isPostLiked(post.id);
        newPostFavorites[post.id] = await isPostFavorite(post.id);
      }

      setPostLikes(newPostLikes);
      setPostFavorites(newPostFavorites);
    };

    loadPostStates();
  }, [posts]);

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
  const handleLike = async (postId: string) => {
    const success = await requireAuth(async () => {
      try {
        const wasLiked = postLikes[postId];
        const newLikedState = !wasLiked;
        
        // Мгновенно обновляем UI
        setPostLikes(prev => ({ ...prev, [postId]: newLikedState }));
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, likes: newLikedState ? p.likes + 1 : Math.max(0, p.likes - 1) }
            : p
        ));
        setVisiblePosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, likes: newLikedState ? p.likes + 1 : Math.max(0, p.likes - 1) }
            : p
        ));

        // Сохраняем в хранилище
        const result = await toggleLike(postId);
        if (!result.success) {
          throw new Error('Failed to toggle like');
        }
      } catch (error) {
        console.error('❌ Ошибка при лайке:', error);
        // Откатываем изменения в случае ошибки
        setPostLikes(prev => ({ ...prev, [postId]: !postLikes[postId] }));
        throw error;
      }
    });

    return success;
  };

  // Добавить/удалить из избранного
  const handleFavorite = async (postId: string) => {
    const success = await requireAuth(async () => {
      try {
        const wasFavorite = postFavorites[postId];
        const newFavoriteState = !wasFavorite;
        
        // Мгновенно обновляем UI
        setPostFavorites(prev => ({ ...prev, [postId]: newFavoriteState }));

        // Сохраняем в хранилище
        const result = await toggleFavorite(postId);
        if (!result.success) {
          throw new Error('Failed to toggle favorite');
        }
      } catch (error) {
        console.error('❌ Ошибка при избранном:', error);
        // Откатываем изменения в случае ошибки
        setPostFavorites(prev => ({ ...prev, [postId]: !postFavorites[postId] }));
        throw error;
      }
    });

    return success;
  };

  const filterPosts = useCallback((data: NearbyPost[], category: string) => {
    if (category === 'all') {
      return data;
    }
    
    // Временное решение: фильтрация по тегам пока сервер не обновлен
    const categoryToTags: Record<string, string[]> = {
      'cafe': ['кафе', 'кофе'],
      'restaurant': ['ресторан', 'отель'],
      'park': ['парк'],
      'museum': ['музей', 'культура', 'история'],
      'shop': ['магазин'],
      'entertainment': ['развлечения', 'события']
    };
    
    const tagsToMatch = categoryToTags[category] || [category];
    
    return data.filter(post => {
      return tagsToMatch.some(tag => 
        post.tags.some(postTag => 
          postTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
    });
  }, []);

  const applyFilter = useCallback((category: string) => {
    const filtered = filterPosts(posts, category);
    setVisiblePosts(filtered);
  }, [filterPosts, posts]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    applyFilter(categoryId);
  };

  const openInMap = (post: NearbyPost) => {
    router.push('/map');
    triggerMapSearch(post.address);
  };

  const buildRoute = (post: NearbyPost) => {
    router.push('/map');
    triggerMapRoute(post.address);
  };

  const handleOpenDetail = (post: NearbyPost) => {
    setActivePost(post);
    setDetailVisible(true);
  };

  const handleCloseDetail = () => {
    setDetailVisible(false);
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

  const handleDownload = (id: string) => {
    console.log(`download for ${id}`);
  };

  const handleOpenProfile = (post: NearbyPost) => {
    router.push({ pathname: '/company/[id]', params: { id: post.id } });
  };

  const renderPost = ({ item }: { item: NearbyPost }) => (
    <TouchableOpacity
      activeOpacity={0.92}
      style={styles.post}
      onPress={() => handleOpenDetail(item)}
    >
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.info}>
        <View style={styles.authorRow}>
          <TouchableOpacity onPress={() => handleOpenProfile(item)} activeOpacity={0.8}>
            <Image source={{ uri: item.userAvatar }} style={styles.authorAvatar} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.authorDetails}
            onPress={() => handleOpenProfile(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.authorName}>{item.user}</Text>
            <Text style={styles.authorHandle}>@{item.userHandle}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.placeRow}>
          <Text style={styles.place}>{item.place}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={16} color="#FFB800" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.userCaption}>от {item.user}</Text>
        <TouchableOpacity
          style={styles.addressRow}
          activeOpacity={0.85}
          onPress={() => openInMap(item)}
        >
          <Ionicons name="location-outline" size={16} color="#2563eb" />
          <Text style={styles.addressText}>{item.address}</Text>
        </TouchableOpacity>
        <View style={styles.tagRow}>
          {item.tags.map(tag => (
            <View key={`${item.id}-${tag}`} style={styles.tagChip}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.actions}>
        <View style={styles.actionGroup}>
          <TouchableOpacity
            onPress={() => handleLike(item.id)}
            style={styles.likeBtn}
            activeOpacity={0.85}
          >
            <Ionicons 
              name={postLikes[item.id] ? "heart" : "heart-outline"} 
              size={24} 
              color={postLikes[item.id] ? "#FF2D55" : "#1C1C1E"} 
            />
            <Text style={[
              styles.likeCount,
              { color: postLikes[item.id] ? "#FF2D55" : "#333" }
            ]}>
              {formatCompactNumber(item.likes)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => buildRoute(item)}
            style={styles.actionButton}
            activeOpacity={0.85}
          >
            <Ionicons name="navigate-outline" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDownload(item.id)}
            style={styles.actionButton} 
            activeOpacity={0.85}
          >
            <Ionicons name="download-outline" size={24} color="#1C1C1E" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          onPress={() => handleFavorite(item.id)}
          style={[styles.actionButton, styles.favoriteButton]} 
          activeOpacity={0.85}
        >
          <Ionicons 
            name={postFavorites[item.id] ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={postFavorites[item.id] ? "#007AFF" : "#1C1C1E"} 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Ionicons name="location-outline" size={48} color="#007AFF" />
        <ThemedText style={styles.loadingText}>Загрузка мест рядом...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <ThemedText type="title" style={styles.title}>
            Места рядом
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Подборка актуальных мест вокруг — маршруты, события и авторские подборки
          </ThemedText>
        </View>

        <FlatList
          horizontal
          data={categoryOptions}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, selectedCategory === item.id && styles.categoryChipActive]}
              onPress={() => handleCategorySelect(item.id)}
            >
              <Ionicons
                name={item.icon}
                size={16}
                color={selectedCategory === item.id ? '#fff' : '#2563eb'}
              />
              <Text style={selectedCategory === item.id ? styles.categoryChipTextActive : styles.categoryChipText}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={visiblePosts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadData}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color="#c6c6c8" />
            <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
              Ничего не найдено
            </ThemedText>
            <ThemedText style={styles.emptyText}>
              Попробуйте выбрать другую категорию
            </ThemedText>
          </View>
        }
      />

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

      <Modal
        visible={isDetailVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseDetail}
      >
        <Pressable style={styles.detailOverlay} onPress={handleCloseDetail}>
          {activePost && (
            <Pressable style={styles.detailCard} onPress={event => event.stopPropagation()}>
              <Image source={{ uri: activePost.image }} style={styles.detailImage} />
              <View style={styles.detailContent}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>{activePost.place}</Text>
                  <View style={styles.detailRating}>
                    <Ionicons name="star" size={18} color="#FFB800" />
                    <Text style={styles.detailRatingText}>{activePost.rating.toFixed(1)}</Text>
                  </View>
                </View>
                <Text style={styles.detailSubtitle}>{activePost.user}</Text>
                <TouchableOpacity
                  style={styles.detailAddressRow}
                  activeOpacity={0.85}
                  onPress={() => {
                    handleCloseDetail();
                    openInMap(activePost);
                  }}
                >
                  <Ionicons name="location-outline" size={18} color="#2563eb" />
                  <Text style={styles.detailAddressText}>{activePost.address}</Text>
                </TouchableOpacity>
                <View style={styles.detailTags}>
                  {activePost.tags.map(tag => (
                    <View key={`${activePost.id}-detail-${tag}`} style={styles.detailTagChip}>
                      <Text style={styles.detailTagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.detailDescription}>
                  {activePost.reviews[0]?.comment ??
                    'Здесь вы найдете лучшие впечатления города: маршруты, атмосферные пространства и события рядом.'}
                </Text>
                <View style={styles.detailMetaRow}>
                  <TouchableOpacity
                    style={styles.detailMeta}
                    activeOpacity={0.85}
                    onPress={() => {
                      handleCloseDetail();
                      openInMap(activePost);
                    }}
                  >
                    <Ionicons name="map-outline" size={18} color="#1e293b" />
                    <Text style={styles.detailMetaText}>На карте</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.detailMeta}
                    activeOpacity={0.85}
                    onPress={() => {
                      handleCloseDetail();
                      buildRoute(activePost);
                    }}
                  >
                    <Ionicons name="navigate-outline" size={18} color="#1e293b" />
                    <Text style={styles.detailMetaText}>Маршрут</Text>
                  </TouchableOpacity>
                  <View style={styles.detailMeta}>
                    <Ionicons 
                      name={postLikes[activePost.id] ? "heart" : "heart-outline"} 
                      size={18} 
                      color={postLikes[activePost.id] ? "#FF2D55" : "#FF2D55"} 
                    />
                    <Text style={styles.detailMetaText}>{`${formatCompactNumber(activePost.likes)} отметок`}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.detailUserBar}>
                <TouchableOpacity
                  style={styles.detailUserInfo}
                  activeOpacity={0.85}
                  onPress={() => handleOpenProfile(activePost)}
                >
                  <Image source={{ uri: activePost.userAvatar }} style={styles.detailUserAvatar} />
                  <View style={styles.detailUserText}>
                    <Text style={styles.detailUserName}>{activePost.user}</Text>
                    <Text style={styles.detailUserCaption}>Автор публикации</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleFavorite(activePost.id)}
                  style={[styles.detailFavoriteButton, postFavorites[activePost.id] && styles.detailFavoriteButtonActive]}
                  activeOpacity={0.85}
                >
                  <Ionicons 
                    name={postFavorites[activePost.id] ? "bookmark" : "bookmark-outline"} 
                    size={22} 
                    color={postFavorites[activePost.id] ? "#007AFF" : "#64748b"} 
                  />
                </TouchableOpacity>
              </View>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </ThemedView>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 12,
    gap: 16,
  },
  headerTop: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  categoriesList: {
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#2563eb',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  categoryChipTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 200,
    gap: 20,
  },
  post: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.15)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  image: {
    width: '100%',
    height: 220,
  },
  info: {
    padding: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  authorHandle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  place: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 184, 0, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B45309',
  },
  userCaption: {
    color: '#777',
    marginTop: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  favoriteButton: {
    marginLeft: 'auto',
  },
  likeCount: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    color: '#0f172a',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
    color: '#475569',
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 15, 26, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  detailCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    shadowColor: '#0f172a',
    shadowOpacity: 0.24,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 20,
  },
  detailImage: {
    width: '100%',
    height: 260,
  },
  detailContent: {
    paddingHorizontal: 24,
    paddingVertical: 22,
    gap: 14,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  detailRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 184, 0, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  detailRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  detailSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  detailAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  detailAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  detailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailTagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  detailTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  detailDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1f2937',
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  detailMetaText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1e293b',
  },
  detailUserBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#e2e8f0',
  },
  detailUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  detailUserAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  detailUserText: {
    gap: 4,
  },
  detailUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  detailUserCaption: {
    fontSize: 13,
    color: '#475569',
  },
  detailFavoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
  },
  detailFavoriteButtonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
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
});