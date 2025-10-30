import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { databaseService, type Post } from '@/constants/content';
import { setUserSession, type UserSession } from '@/lib/user-session';

const THEME = {
  primary: '#2563eb',
  accent: '#0f172a',
  muted: '#64748b',
  surface: '#ffffff',
  border: 'rgba(226,232,240,0.8)',
  backdrop: '#f4f6fb',
};

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [accountType, setAccountType] = useState<'user' | 'company'>('user');
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';
  const isCompany = accountType === 'company';

  // Заглушки для демо-данных (будут заменены реальными данными после логина)
  const sampleFavorites = useMemo(() => [], []);
  const sampleLiked = useMemo(() => [], []);
  const sampleFollowing = useMemo(() => [], []);

  const canSubmit =
    email.trim().length > 0 &&
    password.trim().length > 0 &&
    (!isRegister || (isCompany ? companyName.trim().length > 0 : name.trim().length > 0));

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('Пожалуйста, заполните все поля', 'Укажите почту, пароль и имя, чтобы продолжить.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      // Получаем посты из базы данных для создания демо-данных
      let postsData: Post[] = [];
      try {
        postsData = await databaseService.getPosts();
        console.log('✅ Посты загружены для создания сессии:', postsData.length);
      } catch (error) {
        console.warn('⚠️ Не удалось загрузить посты, используем пустые данные');
      }

      // Создаем демо-данные на основе реальных постов
      const demoFavorites = postsData.slice(0, 3).map(post => post.id);
      const demoLiked = postsData.slice(1, 4).map(post => post.id);
      const demoFollowing = postsData.slice(0, 5).map(post => ({
        id: post.id,
        name: post.user,
        handle: post.userHandle,
        avatar: post.userAvatar,
        description: post.bio,
      }));

      const primaryName =
        (isRegister ? (isCompany ? companyName.trim() : name.trim()) : name.trim()) ||
        email.trim().split('@')[0] ||
        'Гость';

      const normalizedHandle =
        email.trim().split('@')[0]?.replace(/[^a-z0-9_]/gi, '').toLowerCase() || `user${Date.now()}`;

const session: UserSession = {
  id: `user-${Date.now()}`, // string ID
  name: primaryName,
  email: email.trim(),
  handle: normalizedHandle,
  avatar: `https://i.pravatar.cc/200?u=${encodeURIComponent(email.trim() || primaryName)}`,
  accountType,
  favorites: demoFavorites, // Теперь это поле существует
  liked: demoLiked, // Теперь это поле существует
  following: demoFollowing,
  // Добавляем недостающие поля
  surname: null,
  role: accountType, // accountType соответствует 'user' | 'company'
};

      setUserSession(session);
      router.replace('/profile');
    } catch (error) {
      console.error('❌ Ошибка при создании сессии:', error);
      Alert.alert('Ошибка', 'Не удалось войти в систему. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: mode === 'login' ? 'Вход в аккаунт' : 'Создать аккаунт',
          headerTransparent: true,
          headerTintColor: THEME.accent,
          headerBackTitle: 'Назад',
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.avatarWrapper}>
                <Ionicons name="person-circle" size={48} color={THEME.primary} />
              </View>
              <Text style={styles.title}>{isRegister ? 'Добро пожаловать!' : 'С возвращением!'}</Text>
              <Text style={styles.subtitle}>
                {isRegister
                  ? 'Создайте аккаунт и собирайте любимые места города.'
                  : 'Войдите, чтобы сохранять маршруты и делиться впечатлениями.'}
              </Text>
            </View>

            <View style={styles.accountTypeWrapper}>
              <Text style={styles.accountTypeLabel}>
                {isRegister ? 'Тип аккаунта' : 'Войти как'}
              </Text>
              <View style={styles.accountTypeRow}>
                <TouchableOpacity
                  style={[styles.accountTypeChip, accountType === 'user' && styles.accountTypeChipActive]}
                  onPress={() => setAccountType('user')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={accountType === 'user' ? 'person' : 'person-outline'}
                    size={16}
                    color={accountType === 'user' ? '#fff' : THEME.accent}
                  />
                  <Text
                    style={[
                      styles.accountTypeText,
                      accountType === 'user' && styles.accountTypeTextActive,
                    ]}
                  >
                    Пользователь
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.accountTypeChip, accountType === 'company' && styles.accountTypeChipActive]}
                  onPress={() => setAccountType('company')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={accountType === 'company' ? 'business' : 'business-outline'}
                    size={16}
                    color={accountType === 'company' ? '#fff' : THEME.accent}
                  />
                  <Text
                    style={[
                      styles.accountTypeText,
                      accountType === 'company' && styles.accountTypeTextActive,
                    ]}
                  >
                    Компания
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {isRegister && !isCompany && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Ваше имя</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Например, Анна Петрова"
                  style={styles.input}
                  placeholderTextColor={THEME.muted}
                />
              </View>
            )}

            {isRegister && isCompany && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Имя организации</Text>
                <TextInput
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="Например, Gorky Park"
                  style={styles.input}
                  placeholderTextColor={THEME.muted}
                />
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="hello@company.ru"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                placeholderTextColor={THEME.muted}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Пароль</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Введите пароль"
                secureTextEntry
                style={styles.input}
                placeholderTextColor={THEME.muted}
              />
            </View>

            {!isRegister && (
              <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/modal')}>
                <Ionicons name="help-circle-outline" size={18} color={THEME.primary} />
                <Text style={styles.linkText}>Забыли пароль?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, (!canSubmit || loading) && styles.primaryButtonDisabled]}
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Загрузка...' : (isRegister ? 'Зарегистрироваться' : 'Войти')}
              </Text>
            </TouchableOpacity>

            <View style={styles.separator}>
              <View style={styles.line} />
              <Text style={styles.separatorText}>или</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.socialRow}>
              <Pressable style={styles.socialButton}>
                <View style={styles.socialIcon}>
                  <Text style={styles.socialLetter}>Я</Text>
                </View>
                <Text style={styles.socialText}>Yandex</Text>
              </Pressable>
              <Pressable style={styles.socialButton}>
                <Ionicons name="logo-vk" size={20} color={THEME.accent} />
                <Text style={styles.socialText}>VK</Text>
              </Pressable>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                {isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
              </Text>
              <TouchableOpacity onPress={() => setMode(isRegister ? 'login' : 'register')}>
                <Text style={styles.switchLink}>{isRegister ? 'Войти' : 'Зарегистрироваться'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f2f4fa',
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: THEME.surface,
    borderRadius: 28,
    padding: 28,
    gap: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 20 },
    elevation: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.accent,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: THEME.muted,
    lineHeight: 20,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fbfcff',
    fontSize: 15,
    color: THEME.accent,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.primary,
  },
  primaryButton: {
    backgroundColor: THEME.primary,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.border,
  },
  separatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.muted,
    textTransform: 'uppercase',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fbff',
    justifyContent: 'center',
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.accent,
    textAlign: 'center',
  },
  socialIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
  },
  socialLetter: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.accent,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  switchLabel: {
    fontSize: 14,
    color: THEME.muted,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.primary,
  },
  accountTypeRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderRadius: 20,
    padding: 6,
  },
  accountTypeWrapper: {
    gap: 8,
  },
  accountTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: THEME.accent,
    textTransform: 'uppercase',
  },
  accountTypeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 16,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  accountTypeChipActive: {
    backgroundColor: THEME.primary,
  },
  accountTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.accent,
  },
  accountTypeTextActive: {
    color: '#fff',
  },
});