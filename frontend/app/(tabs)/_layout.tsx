import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from 'expo-router';
import { type ComponentProps, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type TabConfig = {
  name: string;
  label: string;
  iconFocused: IoniconName;
  iconDefault: IoniconName;
  position: 'left' | 'center' | 'right';
  variation?: 'primary';
};

const TAB_CONFIG: TabConfig[] = [
  {
    name: 'index',
    label: 'Главная',
    iconFocused: 'home',
    iconDefault: 'home-outline',
    position: 'left'
  },
  {
    name: 'map',
    label: 'Карта',
    iconFocused: 'map',
    iconDefault: 'map-outline',
    position: 'left'
  },
  {
    name: 'search',
    label: 'Поиск',
    iconFocused: 'search',
    iconDefault: 'search-outline', 
    position: 'center',
    variation: 'primary'  
  },
  {
    name: 'profile',
    label: 'Профиль',
    iconFocused: 'person',
    iconDefault: 'person-outline',
    position: 'right'
  },
  {
    name: 'nearby',
    label: 'Рядом',
    iconFocused: 'location',
    iconDefault: 'location-outline',
    position: 'right'
  }
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={props => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="nearby" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const renderTabButton = (tab: TabConfig) => {
    const route = state.routes.find(r => r.name === tab.name);
    if (!route) return null;

    const routeIndex = state.routes.findIndex(r => r.key === route.key);
    const isFocused = state.index === routeIndex;
    const iconName: IoniconName = isFocused ? tab.iconFocused : tab.iconDefault;

    const onPress = async () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        if (tab.name === 'profile') {
          // Проверяем сессию через AsyncStorage
          try {
            const { getUserSession } = await import('@/lib/user-session');
            const userSession = await getUserSession(); // теперь правильно используем await
            
            if (!userSession) {
              console.log('❌ Сессии нет, переходим на логин');
              router.push('/login');
              return;
            }
            
            console.log('✅ Сессия найдена, переходим в профиль');
          } catch (error) {
            console.error('❌ Ошибка проверки сессии:', error);
            router.push('/login');
            return;
          }
        }
        
        // Используем правильную навигацию для табов
        navigation.navigate(tab.name as never);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    // Центральная кнопка поиска (широкая)
    if (tab.position === 'center') {
      return (
        <TouchableOpacity
          key={tab.name}
          style={[
            styles.searchButton,
            tab.variation === 'primary' && styles.primarySearchButton,
            isFocused && styles.searchButtonActive
          ]}
          onPress={onPress}
          onLongPress={onLongPress}
          activeOpacity={0.85}
        >
          <View style={styles.searchButtonContent}>
            <Ionicons 
              name={iconName} 
              size={20} 
              color={tab.variation === 'primary' ? '#fff' : '#1c1c1e'} 
            />
            <Text style={[
              styles.searchButtonText,
              tab.variation === 'primary' ? styles.searchButtonTextPrimary : styles.searchButtonTextSecondary
            ]}>
              {tab.label}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Обычные иконки (главная, профиль, рядом)
    return (
      <TouchableOpacity
        key={tab.name}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel}
        onPress={onPress}
        onLongPress={onLongPress}
        style={[styles.iconButton, isFocused && styles.iconButtonActive]}
      >
        <Ionicons 
          name={iconName} 
          size={24} 
          color={isFocused ? '#007AFF' : '#9E9E9E'} 
        />
      </TouchableOpacity>
    );
  };

  // Группируем табы по позициям
  const leftTabs = TAB_CONFIG.filter(tab => tab.position === 'left');
  const centerTabs = TAB_CONFIG.filter(tab => tab.position === 'center');
  const rightTabs = TAB_CONFIG.filter(tab => tab.position === 'right');

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.islandShadow}>
        <BlurView intensity={70} tint="light" style={styles.islandBlur}>
          <View style={styles.islandOverlay} />
          <View style={styles.islandContent}>
            {/* Левая группа: Главная */}
            <View style={styles.leftGroup}>
              {leftTabs.map(renderTabButton)}
            </View>

            {/* Центральная группа: Поиск */}
            <View style={styles.centerGroup}>
              {centerTabs.map(renderTabButton)}
            </View>

            {/* Правая группа: Профиль и Рядом */}
            <View style={styles.rightGroup}>
              {rightTabs.map(renderTabButton)}
            </View>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

// Компонент экрана компании (добавлен в этот же файл)
function CompanyScreen() {
  const colorScheme = useColorScheme();
  const [isEditing, setIsEditing] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: 'Кофейня "Уютный уголок"',
    category: 'Кафе и рестораны',
    description: 'Уютная кофейня в центре города с лучшим кофе и домашней выпечкой. Идеальное место для встреч с друзьями и работы.',
    address: 'ул. Центральная, 15',
    phone: '+7 (912) 345-67-90',
    website: 'www.cozycorner.ru',
    email: 'info@cozycorner.ru',
    hours: 'Пн-Вс: 8:00 - 23:00',
  });

  const stats = [
    { label: 'Отзывы', value: '156', icon: 'chatbubble-outline' },
    { label: 'Рейтинг', value: '4.8', icon: 'star-outline' },
    { label: 'Фото', value: '89', icon: 'camera-outline' },
  ];

  const amenities = [
    { name: 'Wi-Fi', icon: 'wifi' },
    { name: 'Карта', icon: 'card-outline' },
    { name: 'Веранда', icon: 'home-outline' },
    { name: 'Парковка', icon: 'car-outline' },
  ];

  const handleSave = () => {
    setIsEditing(false);
    Alert.alert('Успех', 'Информация о компании обновлена');
  };

  const handleCall = () => {
    Linking.openURL(`tel:${companyData.phone}`);
  };

  const handleOpenWebsite = () => {
    Linking.openURL(`https://${companyData.website}`);
  };

  const handleOpenMap = () => {
    const url = `https://maps.google.com/?q=${encodeURIComponent(companyData.address)}`;
    Linking.openURL(url);
  };

  const isDark = colorScheme === 'dark';

  return (
    <ThemedView style={screenStyles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={screenStyles.scrollContent}
      >
        {/* Хедер компании */}
        <View style={screenStyles.header}>
          <Image
            source={{ uri: 'https://picsum.photos/400/200?company' }}
            style={screenStyles.coverImage}
          />
          <View style={screenStyles.logoContainer}>
            <Image
              source={{ uri: 'https://picsum.photos/100/100?logo' }}
              style={screenStyles.logo}
            />
          </View>
        </View>

        {/* Основная информация */}
        <View style={screenStyles.mainInfo}>
          <View style={screenStyles.titleSection}>
            {isEditing ? (
              <TextInput
                style={[
                  screenStyles.companyNameInput,
                  { color: isDark ? '#fff' : '#000' }
                ]}
                value={companyData.name}
                onChangeText={(text) => setCompanyData({...companyData, name: text})}
                placeholder="Название компании"
                placeholderTextColor="#999"
              />
            ) : (
              <ThemedText type="title" style={screenStyles.companyName}>
                {companyData.name}
              </ThemedText>
            )}
            <ThemedText style={screenStyles.category}>{companyData.category}</ThemedText>
          </View>

          {/* Статистика */}
          <View style={[
            screenStyles.statsContainer,
            { backgroundColor: isDark ? '#1c1c1e' : '#f8f9fa' }
          ]}>
            {stats.map((stat, index) => (
              <View key={stat.label} style={screenStyles.statItem}>
                <Ionicons name={stat.icon as any} size={20} color="#007AFF" />
                <ThemedText type="defaultSemiBold" style={screenStyles.statValue}>
                  {stat.value}
                </ThemedText>
                <ThemedText style={screenStyles.statLabel}>{stat.label}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Описание */}
        <View style={screenStyles.section}>
          <ThemedText type="defaultSemiBold" style={screenStyles.sectionTitle}>
            О компании
          </ThemedText>
          {isEditing ? (
            <TextInput
              style={[
                screenStyles.descriptionInput,
                { 
                  color: isDark ? '#fff' : '#000',
                  backgroundColor: isDark ? '#2c2c2e' : '#fff'
                }
              ]}
              value={companyData.description}
              onChangeText={(text) => setCompanyData({...companyData, description: text})}
              placeholder="Опишите вашу компанию..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          ) : (
            <ThemedText style={screenStyles.description}>{companyData.description}</ThemedText>
          )}
        </View>

        {/* Удобства */}
        <View style={screenStyles.section}>
          <ThemedText type="defaultSemiBold" style={screenStyles.sectionTitle}>
            Удобства
          </ThemedText>
          <View style={screenStyles.amenitiesGrid}>
            {amenities.map((amenity) => (
              <View key={amenity.name} style={screenStyles.amenityItem}>
                <Ionicons name={amenity.icon as any} size={20} color="#007AFF" />
                <ThemedText style={screenStyles.amenityName}>{amenity.name}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Контактная информация */}
        <View style={screenStyles.section}>
          <ThemedText type="defaultSemiBold" style={screenStyles.sectionTitle}>
            Контакты
          </ThemedText>
          <View style={screenStyles.contactItem}>
            <Ionicons name="location-outline" size={20} color="#007AFF" />
            <View style={screenStyles.contactInfo}>
              <ThemedText style={screenStyles.contactLabel}>Адрес</ThemedText>
              <ThemedText style={screenStyles.contactText}>{companyData.address}</ThemedText>
            </View>
            <TouchableOpacity onPress={handleOpenMap}>
              <Ionicons name="navigate-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          <View style={screenStyles.contactItem}>
            <Ionicons name="call-outline" size={20} color="#007AFF" />
            <View style={screenStyles.contactInfo}>
              <ThemedText style={screenStyles.contactLabel}>Телефон</ThemedText>
              <ThemedText style={screenStyles.contactText}>{companyData.phone}</ThemedText>
            </View>
            <TouchableOpacity onPress={handleCall}>
              <Ionicons name="call" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          <View style={screenStyles.contactItem}>
            <Ionicons name="globe-outline" size={20} color="#007AFF" />
            <View style={screenStyles.contactInfo}>
              <ThemedText style={screenStyles.contactLabel}>Сайт</ThemedText>
              <ThemedText style={screenStyles.contactText}>{companyData.website}</ThemedText>
            </View>
            <TouchableOpacity onPress={handleOpenWebsite}>
              <Ionicons name="open-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          <View style={screenStyles.contactItem}>
            <Ionicons name="time-outline" size={20} color="#007AFF" />
            <View style={screenStyles.contactInfo}>
              <ThemedText style={screenStyles.contactLabel}>Часы работы</ThemedText>
              <ThemedText style={screenStyles.contactText}>{companyData.hours}</ThemedText>
            </View>
          </View>
        </View>

        {/* Действия */}
        <View style={screenStyles.actionsSection}>
          {isEditing ? (
            <View style={screenStyles.editActions}>
              <TouchableOpacity 
                style={[screenStyles.button, screenStyles.cancelButton]}
                onPress={() => setIsEditing(false)}
              >
                <ThemedText style={screenStyles.cancelButtonText}>Отмена</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[screenStyles.button, screenStyles.saveButton]}
                onPress={handleSave}
              >
                <ThemedText style={screenStyles.saveButtonText}>Сохранить</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[screenStyles.button, screenStyles.editButton]}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create-outline" size={18} color="#007AFF" />
              <ThemedText style={screenStyles.editButtonText}>Редактировать</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// Экспортируем CompanyScreen для использования в навигации
export { CompanyScreen };

// Стили для TabBar
const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  islandShadow: {
    width: '86%',
    maxWidth: 420,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 18 },
    elevation: 16,
  },
  islandBlur: {
    borderRadius: 40,
    overflow: 'hidden',
  },
  islandOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  islandContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    gap: 8,
  },
  centerGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
    marginHorizontal: 8,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 130,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(12,23,42,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  primarySearchButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
  },
  searchButtonActive: {
    backgroundColor: '#0056CC',
  },
  searchButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  searchButtonTextPrimary: {
    color: '#fff',
  },
  searchButtonTextSecondary: {
    color: '#1c1c1e',
  },
});

// Стили для экрана компании (переименованы чтобы избежать конфликтов)
const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    position: 'relative',
    marginBottom: 80,
  },
  coverImage: {
    width: '100%',
    height: 200,
  },
  logoContainer: {
    position: 'absolute',
    bottom: -40,
    left: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  mainInfo: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  titleSection: {
    marginBottom: 16,
  },
  companyName: {
    fontSize: 24,
    marginBottom: 4,
  },
  companyNameInput: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
    padding: 0,
  },
  category: {
    fontSize: 16,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.8,
  },
  descriptionInput: {
    fontSize: 16,
    lineHeight: 22,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  amenityName: {
    fontSize: 14,
    color: '#007AFF',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  contactText: {
    fontSize: 16,
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  editButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  editButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(142, 142, 147, 0.3)',
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});