const db = require('./db');

// Функции для работы с базой данных на бэкенде
const databaseService = {
  // Получить все посты
  async getPosts() {
    return new Promise((resolve, reject) => {
      // Получаем основные данные постов
      db.all(`
        SELECT * FROM posts ORDER BY created_at DESC
      `, [], async (err, posts) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const completePosts = [];
          
          for (const post of posts) {
            try {
              // Получаем галерею
              const gallery = await this.getPostGallery(post.id);
              
              // Получаем теги
              const tags = await this.getPostTags(post.id);
              
              // Получаем рабочие часы
              const workingHours = await this.getPostWorkingHours(post.id);
              
              // Получаем отзывы
              const reviews = await this.getPostReviews(post.id);
              
              // Получаем контактную информацию
              const contact = await this.getPostContactInfo(post.id);
              
              completePosts.push({
                id: post.id,
                user: post.user,
                userAvatar: post.userAvatar,
                userHandle: post.userHandle,
                place: post.place,
                image: post.image,
                gallery: gallery,
                likes: post.likes,
                totalLikes: post.totalLikes,
                followers: post.followers,
                rating: post.rating,
                tags: tags,
                bio: post.bio,
                address: post.address, // ВКЛЮЧАЕМ АДРЕС
                category: post.category, // ВКЛЮЧАЕМ КАТЕГОРИЮ
                workingHours: workingHours,
                reviews: reviews,
                contact: contact
              });
            } catch (postError) {
              console.error(`❌ Ошибка при загрузке данных поста ${post.id}:`, postError);
              // Продолжаем с другими постами
              continue;
            }
          }
          
          resolve(completePosts);
        } catch (error) {
          reject(error);
        }
      });
    });
  },

  // Получить галерею поста
  async getPostGallery(postId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT image_url FROM gallery 
        WHERE post_id = ? 
        ORDER BY display_order ASC
      `, [postId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(rows.map(row => row.image_url));
      });
    });
  },

  // Получаем теги поста
  async getPostTags(postId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT tag FROM tags WHERE post_id = ?
      `, [postId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(rows.map(row => row.tag));
      });
    });
  },

  // Получаем рабочие часы поста
  async getPostWorkingHours(postId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT label, value FROM working_hours WHERE post_id = ?
      `, [postId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(rows.map(row => ({
          label: row.label,
          value: row.value
        })));
      });
    });
  },

  // Получаем отзывы поста
  async getPostReviews(postId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT id, author, comment, rating, date FROM reviews WHERE post_id = ?
      `, [postId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(rows.map(row => ({
          id: row.id,
          author: row.author,
          comment: row.comment,
          rating: row.rating,
          date: row.date
        })));
      });
    });
  },

  // Получаем контактную информацию поста
  async getPostContactInfo(postId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT label, value, icon FROM contact_info WHERE post_id = ?
      `, [postId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(rows.map(row => ({
          label: row.label,
          value: row.value,
          icon: row.icon
        })));
      });
    });
  },

  // Получаем все истории
  async getStories() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM stories ORDER BY created_at DESC
      `, [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(rows.map(row => ({
          id: row.id,
          userName: row.userName,
          avatar: row.avatar,
          image: row.image,
          text: row.text,
          postId: row.post_id
        })));
      });
    });
  },

  // Получаем пост по ID
  async getPostById(id) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM posts WHERE id = ?
      `, [id], async (err, post) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!post) {
          resolve(null);
          return;
        }

        try {
          const gallery = await this.getPostGallery(post.id);
          const tags = await this.getPostTags(post.id);
          const workingHours = await this.getPostWorkingHours(post.id);
          const reviews = await this.getPostReviews(post.id);
          const contact = await this.getPostContactInfo(post.id);
          
          resolve({
            id: post.id,
            user: post.user,
            userAvatar: post.userAvatar,
            userHandle: post.userHandle,
            place: post.place,
            image: post.image,
            gallery: gallery,
            likes: post.likes,
            totalLikes: post.totalLikes,
            followers: post.followers,
            rating: post.rating,
            tags: tags,
            bio: post.bio,
            address: post.address, // ВКЛЮЧАЕМ АДРЕС
            category: post.category, // ВКЛЮЧАЕМ КАТЕГОРИЮ
            workingHours: workingHours,
            reviews: reviews,
            contact: contact
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }
};

module.exports = databaseService;