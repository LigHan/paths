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

export type NumericValue = number | string;

export type Post = {
  id: string;
  user: string;
  userAvatar: string;
  userHandle: string;
  place: string;
  address: string;
  image: string;
  gallery: string[];
  likes: NumericValue;
  totalLikes: NumericValue;
  followers: NumericValue;
  rating: number;
  tags: string[];
  bio: string;
  workingHours: WorkingHours[];
  reviews: Review[];
  contact: ContactInfo[];
};

export type NormalizedPost = Omit<Post, 'likes' | 'totalLikes' | 'followers'> & {
  uid: string;
  likes: number;
  totalLikes: number;
  followers: number;
};

export function parseNumericValue(value: NumericValue): number {
  if (typeof value === 'number') {
    return value;
  }

  let str = value.toString().trim().toLowerCase();
  str = str.replace(/\s+/g, '').replace(',', '.');

  let multiplier = 1;
  if (str.includes('млн')) {
    multiplier = 1_000_000;
    str = str.replace('млн', '');
  } else if (str.includes('тыс')) {
    multiplier = 1_000;
    str = str.replace('тыс', '');
  } else if (str.endsWith('k')) {
    multiplier = 1_000;
    str = str.slice(0, -1);
  }

  const parsed = Number.parseFloat(str);
  if (Number.isFinite(parsed)) {
    return parsed * multiplier;
  }
  return 0;
}

export function normalizePost(post: Post, index = 0): NormalizedPost {
  return {
    ...post,
    uid: `${post.id}-${index}`,
    likes: parseNumericValue(post.likes),
    totalLikes: parseNumericValue(post.totalLikes),
    followers: parseNumericValue(post.followers)
  };
}

export function normalizePosts(list: Post[]): NormalizedPost[] {
  return list.map((post, index) => normalizePost(post, index));
}

export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  const formatWithSuffix = (num: number, suffix: string) => {
    const fixed = num.toFixed(1);
    const normalized = fixed.replace(/\.0$/, '').replace('.', ',');
    return `${sign}${normalized} ${suffix}`;
  };

  if (abs >= 1_000_000) {
    return formatWithSuffix(abs / 1_000_000, 'млн');
  }

  if (abs >= 1_000) {
    return formatWithSuffix(abs / 1_000, 'тыс');
  }

  return new Intl.NumberFormat('ru-RU').format(value);
}

export const posts: Post[] = [
  {
    id: '1',
    user: 'Парк имени Щербакова',
    userAvatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/%D0%94%D0%BE%D0%BD%D0%B5%D1%86%D1%8C%D0%BA.JPG/1280px-%D0%94%D0%BE%D0%BD%D0%B5%D1%86%D1%8C%D0%BA.JPG',
    userHandle: 'scherbakovpark',
    place: 'Парк Щербакова',
    address: 'Парк имени Щербакова, Донецк',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/62/Donetsk_Scherbakov_Park.jpg',
    gallery: [
      'https://avatars.mds.yandex.net/i?id=fa5cefd9eeeb22774c6cfbed725c2522_l-4628278-images-thumbs&n=13',
      'https://yandex-images.clstorage.net/hfH560y79/942910BN/ALfIu_Wv-gZqWMTBUio_N9FeMpKaISvTaAO16U2PaiKeqQKfeG4v_mj_RfDmbH-n8cvZpkD-U7SZDKkvq1bxuZX2iOrxa563D-0QoCdqvweBf-dGqzDucy3SEcyNPnqXfjlijJvJGMlOWNNHJH74c_GLLJMkP-ewX39oXn5xJDlz9FuIR14rwMvJJ6Xhy3yW8j7HcVpRz0CtI-fvzo-eBDkuRP86i6qqfcjy5patyPCy6V1TRtvm8bz8LM59UJY5EwQqOPc8uWHZu6cXkupORRAup1F7Ir4THrO3zE6fPCcJDfafubiImEz60JYXTgsTAMqc8zWoRBOuzRyuj0PXqRBmGLn37EiSqBplNuOLHbbjrySjSfAtgU0CZP4crN5W2563PQr6WlpteUA1lpw50sKZ_UI3qdUzvNzOzywx5cjBJrmZ1Y_Kc6koNQQx-Y8WAd3HEEjyvcMuoCQNPW_dVvsfdq94exupztujVxROuaDzKewzZLvVAY_dnx8fsvT7YiRLOeQcmhD4mgWl8PtMtwA9NzMpUB-wfINl7g7_vFVKjgc-Gqm4-GyogUenPovwEPud0Pa4RiGuDI3eTvKXK5KGKvgFb_piqki0V3HafnTiHQXjS2HPA07zV_2fbf2XSp4X7jh5aooumoP1Npyo4LH7bUGnWqTgrs2OvY7ipukA97jYl6_ZYvuIZNeCG461YJzWA_hgLKGf0gVvD3w9VUhN18xZODmo70pz5ycc6ZKwy76hJqqGUR0dPd78ciSakof6uyWu6GIrmCRXoYh8p-KvBIBosT2DnYM3vC7e7Ada_yYd-lvqaE0aE8XXjUnRA_kPsNSJVKN8LA8cTbAkOMI2Scjln7limevlh5Ka3VSxzqSzWjENMt6jRiwvXd_3KJ63bzp5q3uMujL2lzyY4oKYroD02TWB7-08jkxhJ4qgBbuJhc_pwkrYJvdDqT7k8A3XEmpSHgN_YzVfnq8sQ',
      'https://avatars.dzeninfra.ru/get-zen_doc/271828/pub_686aa1b108ff0248e56f6165_686aa1b108ff0248e56f6166/scale_1200',
      'https://a.d-cd.net/aIAAAgO7gOA-1920.jpg',
      'https://present5.com/presentacii/20170505/46-doneckaya_narodnaya_respublika_-_rodina_moya_(urok).pptx_images/46-doneckaya_narodnaya_respublika_-_rodina_moya_(urok).pptx_1.jpg',
      'https://avatars.mds.yandex.net/i?id=5d81ba97a6e13980011cad59f8a6ba0f_l-5236382-images-thumbs&n=13',
      'https://pp.userapi.com/c630724/v630724831/507a4/_ZY4KMKRRrU.jpg',
      'https://i2016.otzovik.com/2016/05/02/3298328/img/55868034.jpeg',
    ],
    likes: '505.8k',
    totalLikes: '4.040 млн',
    followers: '252 тыс',
    rating: 4.8,
    tags: ['Парк', 'Семейный отдых', 'Озеро'],
    bio: 'Парк Щербакова — зелёный оазис для прогулок, занятий спортом и семейного отдыха. Здесь проходят фестивали, концерты и кинопоказы под открытым небом.',
    workingHours: [
      { label: 'Пн - Пт', value: '08:00 - 23:00' },
      { label: 'Сб - Вс', value: '10:00 - 01:00' },
    ],
    reviews: [
      {
        id: 'r1',
        author: 'Екатерина',
        comment: 'Люблю этот парк — особенно вечером, когда включают подсветку фонтанов.',
        rating: 5,
        date: '12 мая 2024',
      },
      {
        id: 'r2',
        author: 'Максим',
        comment: 'Хорошо оборудованные дорожки, много кафе. Единственный минус — многолюдно по выходным.',
        rating: 4,
        date: '8 мая 2024',
      },
    ],
    contact: [
      { label: 'Официальный сайт', value: 'https://gorkiypark.com', icon: 'globe-outline' },
      { label: 'Телефон', value: '+7 (495) 995-00-20', icon: 'call-outline' },
      { label: 'Email', value: 'info@gorkiypark.com', icon: 'mail-outline' },
    ],
  },
  {
    id: '2',
    user: 'Музей ВОВ Донецк',
    userAvatar: 'https://sun9-56.userapi.com/s/v1/if1/1wBsSjoL_DE-ioMffbJvgvW-h4rjp9LcNr2wbBYB4oEuK8fotKx2oHQw0SJcFHziiWgQWaEW.jpg?quality=96&as=32x21,48x32,72x48,108x72,160x107,240x160,360x240,480x320,540x360,640x427,720x480,1080x720,1280x853,1350x900&from=bu&cs=1350x0',
    userHandle: 'vov_museum_donetsk',
    place: 'Музей Великой Отечественной войны',
    address: 'Музей Великой Отечественной войны,  Донецк',
    image: 'https://cdn.culture.ru/images/795e55ba-477e-5bc6-9c0b-3d4b8328e08b',
    gallery: [
      'https://sun9-5.userapi.com/s/v1/if2/dkBaRZWYkiy52ClKSCYTHhX-BZjpq2XBJmnW4cLUXpdOz6OgVYbvWEEQCmF1vdsU7eAkojRdh6DDiiC-FAq8MHet.jpg?quality=96&as=32x21,48x32,72x48,108x72,160x107,240x160,360x240,480x320,540x360,640x427,720x480,1080x720,1280x853,1440x960,2560x1707&from=bu&cs=2560x0',
      'https://sun9-73.userapi.com/s/v1/if2/ghdVnlZwlthRgxusvB59i0bFe5RJTbJUwKLxAd_JKiYi3OAfABoq1xziYhhXJkDKXxU2zTg8VQ2FRm_s7EU8DHuS.jpg?quality=96&as=32x21,48x32,72x48,108x72,160x107,240x160,360x240,480x320,540x360,640x427,720x480,1080x720,1280x853,1440x960,2560x1707&from=bu&cs=2560x0',
      'https://sun9-43.userapi.com/s/v1/if1/KExLvpmQirLsRPVcinJFSOlK4eb_FP3UYBLmhkSBYYZYC3EiuJLuMKAS_sXd3QHakB1KG3x4.jpg?quality=96&as=32x21,48x32,72x48,108x72,160x107,240x160,360x240,480x320,540x360,640x427,720x480,1080x720,1280x853,1350x900&from=bu&cs=1350x0',
      'https://sun9-18.userapi.com/s/v1/if1/MTgeMqwMirmMQ4vvJBNGoFx_1WJxopX2jKzkuGMxYijZCRl7QVet5WamUVbDkL6aFGKMA88W.jpg?quality=96&as=32x21,48x32,72x48,108x72,160x107,240x160,360x240,480x320,540x360,640x427,720x480,1080x720,1280x853,1350x900&from=bu&cs=1350x0',
      'https://sun9-58.userapi.com/s/v1/if1/dfiv3rB7QuhTnNtNaAT6G-A5lBIu6AVjdGwRFDKAztS3zw2bZtshdK9509D2cf3F_s1F9Cw7.jpg?quality=96&as=32x21,48x32,72x48,108x72,160x107,240x160,360x240,480x320,540x360,640x427,720x480,1080x720,1280x853,1350x900&from=bu&cs=1350x0',
      'https://sun9-38.userapi.com/s/v1/if1/Mgk9msGlhldtbXKooaMpxaXcTDN4cOz_r8sKyjKoxKkc3IsZEg8H-TQeMsuGbz1hNitluV2a.jpg?quality=96&as=32x21,48x32,72x48,108x72,160x107,240x160,360x240,480x320,540x360,640x427,720x480,1080x720,1280x853,1350x900&from=bu&cs=1350x0',
      'https://sun9-70.userapi.com/s/v1/if2/QnFYEEPNtiuLkTf3IoOiK_WPitC2qZgz3CnZdXtTf8rD_jSzE9nXD3G8ookgUKyjo3Uhk9T02n8yLd_MRIpJYOpB.jpg?quality=96&as=32x21,48x32,72x48,108x72,160x107,240x160,360x240,480x320,540x360,640x426,720x480,1080x720,1280x853,1361x907&from=bu&cs=1361x0',
      'https://sun9-61.userapi.com/s/v1/if2/WsxuHNZaQAfBr0kwNrmC8WKyNBNp1jQsUZ-WA23m1__XfUaxt4rHbJwyZCVcikbgXPlThPO3kV0GGDcZBWRI1CvL.jpg?quality=96&as=32x21,48x32,72x48,108x72,160x107,240x160,360x240,480x320,540x360,640x426,720x480,1080x720,1280x853,1361x907&from=bu&cs=1361x0',
    ],
    likes: '197.6k',
    totalLikes: '2.3 млн',
    followers: '99 тыс',
    rating: 4.5,
    tags: ['Культура', 'Выставки', 'История'],
    bio: 'Музей Великой Отечественной войны - одно из главных источрических мест Донецка. Полезные информационные стенды, рассказывающие о подвиге советского народа.',
    workingHours: [
      { label: 'Пн - Пт', value: '09:00 - 20:00' },
      { label: 'Сб - Вс', value: '10:00 - 22:00' },
    ],
    reviews: [
      {
        id: 'r3',
        author: 'Тёма',
        comment: 'Отлично для изучения истории. Приветливый персонал и есть скидка студентам. Твердая пятерка!',
        rating: 5,
        date: '9 мая 2025 год',
      },
      {
        id: 'r4',
        author: 'Ольга',
        comment: 'Отличный музей. Обязательно посещу еще раз.',
        rating: 4,
        date: '18 апреля 2024 год',
      },
    ],
    contact: [
      { label: 'Официальный сайт', value: 'vov-museum-donetsk.ru', icon: 'globe-outline' },
      { label: 'Телефон', value: '+7 (495) 544-34-00', icon: 'call-outline' },
      { label: 'Email', value: 'info@vov.donetsk', icon: 'mail-outline' },
    ],
  },
  {
    id: '3',
    user: 'Парк кованных фигур',
    userAvatar: 'https://avatars.mds.yandex.net/get-altay/4365916/2a00000179881604fa320ca37be6225d737d/XXXL',
    userHandle: 'steel-park',
    place: 'Парк кованных фигур',
    address: 'Парк кованных фигур, Донецк',
    image: 'https://avatars.mds.yandex.net/get-altay/1903890/2a00000169d6115feb1904cd6b2e8f6c63cf/XXXL',
    gallery: [
      'https://storage.yandexcloud.net/regions/posts/media/thumbnails/2024/09/large/5UHLRnbgwc1XCEX3Uq5Vq5nzzgYMlPFI5GWJ8eeK.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/9/9f/1park_kovanyih_figur.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/8/86/%D0%9F%D0%B0%D1%80%D0%BA_%D0%BA%D0%BE%D0%B2%D0%B0%D0%BD%D0%BD%D1%8B%D1%85_%D1%84%D0%B8%D0%B3%D1%83%D1%80_-_panoramio.jpg',
      'https://cdn.fishki.net/upload/post/201511/12/1733917/9225179_9f5da12d.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/%D0%90%D0%BB%D0%B5%D1%8F_%D0%B0%D1%80%D0%BE%D0%BA_%D0%9F%D0%B0%D1%80%D0%BA_%D0%BA%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D1%85_%D1%84%D1%96%D0%B3%D1%83%D1%80.JPG/1400px-%D0%90%D0%BB%D0%B5%D1%8F_%D0%B0%D1%80%D0%BE%D0%BA_%D0%9F%D0%B0%D1%80%D0%BA_%D0%BA%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D1%85_%D1%84%D1%96%D0%B3%D1%83%D1%80.JPG',
      'https://avatars.dzeninfra.ru/get-zen_doc/271828/pub_66cac9bdeffbd40e42e6098b_66cac9deb8c9e43ea2fce987/scale_1200',
      'https://tvkrasnodar.ru/upload/iblock/650/650d0d49594e5b5b7528b90b309dc96d.jpg',
      'https://avatars.dzeninfra.ru/get-zen_doc/271828/pub_6790a4ef3d6b79211452973f_6790a6f6fa87ea6b3d90a375/scale_1200',
    ],
    likes: '708k',
    totalLikes: '1.01 млн',
    followers: '45 тыс',
    rating: 4.9,
    tags: ['История', 'Главные места', 'События'],
    bio: 'Парк кованных фигур - красивое и необычное сочетание природы и железа',
    workingHours: [{ label: 'Ежедневно', value: 'Круглосуточно' }],
    reviews: [
      {
        id: 'r5',
        author: 'Сергей',
        comment: 'Вечером невероятно красиво.',
        rating: 5,
        date: '1 мая 2024',
      },
      {
        id: 'r6',
        author: 'Виктория',
        comment: 'Невероятные фигуры.',
        rating: 5,
        date: '22 апреля 2024',
      },
    ],
    contact: [
      { label: 'Сайт', value: 'https://kremlin.ru', icon: 'globe-outline' },
      { label: 'Телефон', value: '+7 (495) 620-65-65', icon: 'call-outline' },
      { label: 'Email', value: 'info@redsquare.ru', icon: 'mail-outline' },
    ],
  },
  {
    id: '4',
    user: 'Администрация Донецка ✔',
    userAvatar: 'https://core-pht-proxy.maps.yandex.ru/v1/photos/download?photo_id=xPx2x_gogBtpwm7nBXtxWA&image_size=X5L',
    userHandle: 'donetsk_gov',
    place: 'Площадь Ленина',
    address: 'площадь Ленина, Донецк',
    image: 'https://core-pht-proxy.maps.yandex.ru/v1/photos/download?photo_id=mtpbU5DRUI2xSXV1tP5Ahg&image_size=XXXL',
    gallery: [
      'https://core-pht-proxy.maps.yandex.ru/v1/photos/download?photo_id=VMzAlGyrjo9sBuOjlX-bdA&image_size=X5L',
      'https://core-pht-proxy.maps.yandex.ru/v1/photos/download?photo_id=nuS_pBa3X0UKpszeOcdBgg&image_size=X5L',
      'https://upload.wikimedia.org/wikipedia/commons/8/86/%D0%9F%D0%B0%D1%80%D0%BA_%D0%BA%D0%BE%D0%B2%D0%B0%D0%BD%D0%BD%D1%8B%D1%85_%D1%84%D0%B8%D0%B3%D1%83%D1%80_-_panoramio.jpg',
      'https://core-pht-proxy.maps.yandex.ru/v1/photos/download?photo_id=EA6bZwnWJb9Qw2gOsIaluA&image_size=X4L',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/%D0%90%D0%BB%D0%B5%D1%8F_%D0%B0%D1%80%D0%BE%D0%BA_%D0%9F%D0%B0%D1%80%D0%BA_%D0%BA%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D1%85_%D1%84%D1%96%D0%B3%D1%83%D1%80.JPG/1400px-%D0%90%D0%BB%D0%B5%D1%8F_%D0%B0%D1%80%D0%BE%D0%BA_%D0%9F%D0%B0%D1%80%D0%BA_%D0%BA%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D1%85_%D1%84%D1%96%D0%B3%D1%83%D1%80.JPG',
      'https://avatars.dzeninfra.ru/get-zen_doc/271828/pub_66cac9bdeffbd40e42e6098b_66cac9deb8c9e43ea2fce987/scale_1200',
      'https://tvkrasnodar.ru/upload/iblock/650/650d0d49594e5b5b7528b90b309dc96d.jpg',
      'https://avatars.dzeninfra.ru/get-zen_doc/271828/pub_6790a4ef3d6b79211452973f_6790a6f6fa87ea6b3d90a375/scale_1200',
    ],
    likes: '24.1 млн',
    totalLikes: '760.9 млн',
    followers: '2.5 млн',
    rating: 5.0,
    tags: ['Главные места', 'Администрация', 'Донецк'],
    bio: 'Страница администрации города Донецк.',
    workingHours: [{ label: 'Ежедневно', value: 'Круглосуточно' }],
    reviews: [
      {
        id: 'r5',
        author: 'Сергей',
        comment: '',
        rating: 5,
        date: '1 мая 2024',
      },
      {
        id: 'r6',
        author: 'Виктория',
        comment: '',
        rating: 5,
        date: '22 апреля 2024',
      },
    ],
    contact: [
      { label: 'Сайт', value: 'https://kremlin.ru', icon: 'globe-outline' },
      { label: 'Телефон', value: '+7 (495) 620-65-65', icon: 'call-outline' },
      { label: 'Email', value: 'donetsk@gov.ru', icon: 'mail-outline' },
    ],
  },
  {
    id: '5',
    user: 'Отель «Донбасс Палас»',
    userAvatar: 'https://avatars.mds.yandex.net/get-altay/1773749/2a0000016e0456c6f4fe3ed691eb36b1a985/XXXL',
    userHandle: 'donbass_palas',
    place: 'Отель «Донбасс Палас»',
    address: 'улица Артёма, 80, Донецк',
    image: 'https://avatars.mds.yandex.net/get-altay/10963815/2a0000018c8239fa056823daa2451d86022c/XXXL',
    gallery: [
      'https://avatars.mds.yandex.net/get-altay/1773749/2a0000016e0456dbe121bc6fddd054dda0f6/XXXL',
      'https://avatars.mds.yandex.net/get-altay/5234599/2a00000180b69a0befd1df5b820691e5e5a3/XXXL',
      'https://avatars.mds.yandex.net/get-altay/11522875/2a0000018e6b5c4cfc109d67591f8e07e604/XXXL',
    ],
    likes: '45.9k',
    totalLikes: '990 тыс',
    followers: '25 тыс',
    rating: 4.5,
    tags: ['Отдых', 'Отели', 'Донецк'],
    bio: 'Страница отеля «Донбасс Палас». ',
    workingHours: [
      { label: 'Пн - Вс', value: 'Круглосуточно' },
     ],
    reviews: [
      {
        id: 'r3',
        author: 'Тёма',
        comment: '',
        rating: 4,
        date: '11 мая 2025 год',
      },
      {
        id: 'r4',
        author: 'Ольга',
        comment: 'Хороший отель',
        rating: 5,
        date: '21 апреля 2024 год',
      },
    ],
    contact: [
      { label: 'Официальный сайт', value: 'vov-museum-donetsk.ru', icon: 'globe-outline' },
      { label: 'Телефон', value: '+7 (495) 544-34-00', icon: 'call-outline' },
      { label: 'Email', value: 'info@dn-palas', icon: 'mail-outline' },
    ],
  },
  {
    id: '6',
    user: 'Don Coffee',
    userAvatar: 'https://i.pinimg.com/736x/13/bd/84/13bd848b15c68200a6a92d7aa61fd5ea.jpg',
    userHandle: 'don-coffee',
    place: 'Кофейня Don Coffee',
    address: 'проспект Богдана Хмельницкого, 100, Донецк',
    image: 'https://yandex-images.clstorage.net/hfH560y79/942910BN/ALfIu_Wv-gZqWMTBUio_N9FeMpKaISvTaAO16U3K7xeL_FIqKF4qzhjPdSAzTC8HMb751hDOE_RZyQw_3eNgbHXjLf8gO7_iGliVheKO_pcQX2ZTThB_8vhDwHmI3IzVif5UTZsZmKn_S7B1Vkw7FoC6nyCBupbzjAwfDR0xVlkAVOnrF-6JQ9nJ5sTCuQ_2MWzmorgzPEMc0Idurq8tlzudZ926uCp6z8jzFyeMWfKB-3yjxSqV0j4Mf_1sgeY7kvX7mZdc-mLrGgTUopkuhUA_VTLoELxTvvO3TRzPrqQZr1bvmMirmQwrQTTmLCqBIxlukvVKZ8F_nHyfXgDm62MGijhVfYsDuOn3VSFrHFfTrQaDOyLuYFyCZd5dbR3my213bAhrKks-6oNnh50ogLI5fIMnK8SzTf2t3_8gxIjh54sKBU9ZcSpJFSfC2B1VQ-9lIXvRz6NfgkVfnP9vZ4qe1M7rCaiZvpiy15bse5KyC0-Cdvv3MFzODt0NgPUbsYTauDXumHPp6BTHMvt89-GcNwI6MvwzPoH0zu1uDbUpz3a9yRkb6YzIUQXnD-mRIStuU2Q6pnA_Hv5_bEEUaNH2iGqEHBlS2yv25wArHsYxLwVyCCFtoX9D9N79vi9l-700j8urikuv2PAFF564c8PqbpJnWWZgDtxsDv5hhqjy9tmqVJzqkyvqdGbTy63H0o3UU1qz_bC_gfYNPZxOJKif9V87uZvL7qrxNcR-OYPhW91C1DoU8Iyv_n68AjSpw_YJuhQcyQDZ-PZVAUg9FsOv1gJoYNwSbtPkv8xN7Ud7X1cPW5trWk7pQgd1b8ugM6m8c-b4pTKMDa7PD3H0mJL2u8nVzPoSeAulNKF7D5bzHpUiGfDdkV0jlt5dPy1lOkyWr3qoK-uf2sNm1F_r8FKLL7LVaqTjj7_M_P0wlMjCVmj6FrwrIZu75PfS2j_14C804mqDbGOukcX-bu49M',
    gallery: [
      'https://img.goodfon.ru/wallpaper/nbig/b/42/pirozhnoe-eklery-kofe-kofeynye.webp',
          ],
    likes: '150k',
    totalLikes: '890 тыс',
    followers: '9.9 тыс',
    rating: 4.9,
    tags: ['Отдых', 'Кофе', 'Кафе'],
    bio: 'Ждем вас у нас!',
    workingHours: [{ label: 'Ежедневно', value: 'Круглосуточно' }],
    reviews: [
      {
        id: 'r5',
        author: 'Даниил',
        comment: 'Вкусный кофе',
        rating: 5,
        date: '11 мая 2024',
      },
      {
        id: 'r6',
        author: 'Виктория',
        comment: '',
        rating: 4,
        date: '22 апреля 2024',
      },
    ],
    contact: [
      { label: 'Сайт', value: 'https://kremlin.ru', icon: 'globe-outline' },
      { label: 'Телефон', value: '+7 (495) 620-65-65', icon: 'call-outline' },
      { label: 'Email', value: 'info@redsquare.ru', icon: 'mail-outline' },
    ],
  },
  {
    id: '4',
    user: 'Администрация Донецка ✔',
    userAvatar: 'https://core-pht-proxy.maps.yandex.ru/v1/photos/download?photo_id=xPx2x_gogBtpwm7nBXtxWA&image_size=X5L',
    userHandle: 'donetsk_gov',
    place: 'Донбасс Арена',
    address: 'улица Челюскинцев, 189Е, Донецк',
    image: 'https://cdn-storage-media.tass.ru/tass_media/2022/03/13/F/1647204201434011_FvjY-8wd.jpg',
    gallery: [
      'https://core-pht-proxy.maps.yandex.ru/v1/photos/download?photo_id=VMzAlGyrjo9sBuOjlX-bdA&image_size=X5L',
      'https://core-pht-proxy.maps.yandex.ru/v1/photos/download?photo_id=nuS_pBa3X0UKpszeOcdBgg&image_size=X5L',
      'https://upload.wikimedia.org/wikipedia/commons/8/86/%D0%9F%D0%B0%D1%80%D0%BA_%D0%BA%D0%BE%D0%B2%D0%B0%D0%BD%D0%BD%D1%8B%D1%85_%D1%84%D0%B8%D0%B3%D1%83%D1%80_-_panoramio.jpg',
      'https://core-pht-proxy.maps.yandex.ru/v1/photos/download?photo_id=EA6bZwnWJb9Qw2gOsIaluA&image_size=X4L',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/%D0%90%D0%BB%D0%B5%D1%8F_%D0%B0%D1%80%D0%BE%D0%BA_%D0%9F%D0%B0%D1%80%D0%BA_%D0%BA%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D1%85_%D1%84%D1%96%D0%B3%D1%83%D1%80.JPG/1400px-%D0%90%D0%BB%D0%B5%D1%8F_%D0%B0%D1%80%D0%BE%D0%BA_%D0%9F%D0%B0%D1%80%D0%BA_%D0%BA%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D1%85_%D1%84%D1%96%D0%B3%D1%83%D1%80.JPG',
      'https://avatars.dzeninfra.ru/get-zen_doc/271828/pub_66cac9bdeffbd40e42e6098b_66cac9deb8c9e43ea2fce987/scale_1200',
      'https://tvkrasnodar.ru/upload/iblock/650/650d0d49594e5b5b7528b90b309dc96d.jpg',
      'https://avatars.dzeninfra.ru/get-zen_doc/271828/pub_6790a4ef3d6b79211452973f_6790a6f6fa87ea6b3d90a375/scale_1200',
    ],
    likes: '7.1 млн',
    totalLikes: '760.9 млн',
    followers: '2.5 млн',
    rating: 5.0,
    tags: ['Главные места', 'Администрация', 'Донецк'],
    bio: 'Страница администрации города Донецк.',
    workingHours: [{ label: 'Ежедневно', value: 'Круглосуточно' }],
    reviews: [
      {
        id: 'r5',
        author: 'Сергей',
        comment: '',
        rating: 5,
        date: '1 мая 2024',
      },
      {
        id: 'r6',
        author: 'Виктория',
        comment: '',
        rating: 5,
        date: '22 апреля 2024',
      },
    ],
    contact: [
      { label: 'Сайт', value: 'https://kremlin.ru', icon: 'globe-outline' },
      { label: 'Телефон', value: '+7 (495) 620-65-65', icon: 'call-outline' },
      { label: 'Email', value: 'donetsk@gov.ru', icon: 'mail-outline' },
    ],
  },

];

export const stories: Story[] = [
  {
    id: 's1',
    userName: 'Парк Щербакова',
    avatar: posts[0].userAvatar,
    image: posts[0].gallery[0],
    text: 'Скоро лето, а это значит что нужно посетить парк с вашими детьми. Ждем вас!',
    postId: '1',
  },
  {
    id: 's1',
    userName: 'Администрация Донецка',
    avatar: posts[3].userAvatar,
    image: posts[3].gallery[1],
    text: 'Продемонстрировали новое ночное освещение!',
    postId: '1',
  },


  ];
