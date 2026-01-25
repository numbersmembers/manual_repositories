import { storage } from "./storage";

export async function seedDatabase() {
  try {
    // Check if Supabase is being used - skip seeding for Supabase as it should be done via SQL Editor
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      console.log("Using Supabase - skipping automatic seeding. Please seed via Supabase SQL Editor.");
      return;
    }

    // Check if database already has users (for Replit PostgreSQL)
    const existingUsers = await storage.getAllUsers();
    
    if (existingUsers.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database...");

    // Seed users
    const admin = await storage.createUser({
      email: 'mrmoon@numbers.co.kr',
      name: '문병선',
      level: 3,
      isAdmin: 1,
      status: 'active',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Moon'
    });

    const staff = await storage.createUser({
      email: 'staff@numbers.co.kr',
      name: '김스탭',
      level: 2,
      isAdmin: 0,
      status: 'active',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Staff'
    });

    const general = await storage.createUser({
      email: 'user@numbers.co.kr',
      name: '이일반',
      level: 1,
      isAdmin: 0,
      status: 'active',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'
    });

    // Seed categories
    const c1 = await storage.createCategory({ name: '경제', parentId: null, path: '경제' });
    const c4 = await storage.createCategory({ name: 'IT', parentId: null, path: 'IT' });
    const c6 = await storage.createCategory({ name: '인사/총무', parentId: null, path: '인사/총무' });

    const c2 = await storage.createCategory({ name: '산업', parentId: c1.id, path: '경제/산업' });
    const c5 = await storage.createCategory({ name: '반도체', parentId: c4.id, path: 'IT/반도체' });
    const c7 = await storage.createCategory({ name: '규정', parentId: c6.id, path: '인사/총무/규정' });

    const c3 = await storage.createCategory({ name: '자동차', parentId: c2.id, path: '경제/산업/자동차' });

    // Seed documents
    await storage.createDocument({
      title: '2026년도 전사 경영 목표 (대외비)',
      type: 'pdf',
      securityLevel: 'secret',
      categoryId: c1.id,
      url: '#',
      authorId: admin.id,
      authorName: admin.name,
      size: '2.4 MB'
    });

    await storage.createDocument({
      title: '1분기 산업 동향 보고서',
      type: 'google_docs',
      securityLevel: 'important',
      categoryId: c2.id,
      url: '#',
      authorId: staff.id,
      authorName: staff.name,
      size: 'N/A'
    });

    await storage.createDocument({
      title: '신규 전기차 시장 분석',
      type: 'excel',
      securityLevel: 'important',
      categoryId: c3.id,
      url: '#',
      authorId: staff.id,
      authorName: staff.name,
      size: '4.5 MB'
    });

    await storage.createDocument({
      title: '사내 와이파이 접속 가이드',
      type: 'text',
      securityLevel: 'general',
      categoryId: c6.id,
      url: '#',
      authorId: admin.id,
      authorName: admin.name,
      size: '12 KB'
    });

    await storage.createDocument({
      title: '복리후생 규정집 v3.0',
      type: 'hwp',
      securityLevel: 'general',
      categoryId: c7.id,
      url: '#',
      authorId: admin.id,
      authorName: admin.name,
      size: '1.2 MB'
    });

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
