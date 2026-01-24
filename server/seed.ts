import { db } from "./storage";
import { users, categories, documents } from "@shared/schema";

export async function seedDatabase() {
  try {
    // Check if database already has users
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database...");

    // Seed users
    const [admin, staff, general] = await db.insert(users).values([
      {
        email: 'mrmoon@numbers.co.kr',
        name: '문병선',
        level: 3,
        isAdmin: 1,
        status: 'active',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Moon'
      },
      {
        email: 'staff@numbers.co.kr',
        name: '김스탭',
        level: 2,
        isAdmin: 0,
        status: 'active',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Staff'
      },
      {
        email: 'user@numbers.co.kr',
        name: '이일반',
        level: 1,
        isAdmin: 0,
        status: 'active',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'
      }
    ]).returning();

    // Seed categories
    const [c1, c4, c6] = await db.insert(categories).values([
      { name: '경제', parentId: null, path: '경제' },
      { name: 'IT', parentId: null, path: 'IT' },
      { name: '인사/총무', parentId: null, path: '인사/총무' },
    ]).returning();

    const [c2, c5, c7] = await db.insert(categories).values([
      { name: '산업', parentId: c1.id, path: '경제/산업' },
      { name: '반도체', parentId: c4.id, path: 'IT/반도체' },
      { name: '규정', parentId: c6.id, path: '인사/총무/규정' },
    ]).returning();

    const [c3] = await db.insert(categories).values([
      { name: '자동차', parentId: c2.id, path: '경제/산업/자동차' },
    ]).returning();

    // Seed documents
    await db.insert(documents).values([
      {
        title: '2026년도 전사 경영 목표 (대외비)',
        type: 'pdf',
        securityLevel: 'secret',
        categoryId: c1.id,
        url: '#',
        authorId: admin.id,
        authorName: admin.name,
        size: '2.4 MB'
      },
      {
        title: '1분기 산업 동향 보고서',
        type: 'google_docs',
        securityLevel: 'important',
        categoryId: c2.id,
        url: '#',
        authorId: staff.id,
        authorName: staff.name,
        size: 'N/A'
      },
      {
        title: '신규 전기차 시장 분석',
        type: 'excel',
        securityLevel: 'important',
        categoryId: c3.id,
        url: '#',
        authorId: staff.id,
        authorName: staff.name,
        size: '4.5 MB'
      },
      {
        title: '사내 와이파이 접속 가이드',
        type: 'text',
        securityLevel: 'general',
        categoryId: c6.id,
        url: '#',
        authorId: admin.id,
        authorName: admin.name,
        size: '12 KB'
      },
      {
        title: '복리후생 규정집 v3.0',
        type: 'hwp',
        securityLevel: 'general',
        categoryId: c7.id,
        url: '#',
        authorId: admin.id,
        authorName: admin.name,
        size: '1.2 MB'
      }
    ]);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
