import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || 'bloter-numbers-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    console.warn("Google OAuth credentials not configured. Auth will not work.");
    return;
  }

  const callbackURL = process.env.GOOGLE_CALLBACK_URL || "https://bloter-numbers-manual.replit.app/api/auth/google/callback";
  console.log('Using Google OAuth callback URL:', callbackURL);

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (accessToken, refreshToken, profile: Profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || '';
          const user = await authStorage.upsertUser({
            id: profile.id,
            email: email,
            firstName: profile.name?.givenName || profile.displayName,
            lastName: profile.name?.familyName || '',
            profileImageUrl: profile.photos?.[0]?.value,
          });
          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await authStorage.getUser(id);
      done(null, user || null);
    } catch (error) {
      done(error);
    }
  });

  app.get("/api/login", passport.authenticate("google", {
    scope: ["profile", "email"],
  }));

  app.get("/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login",
    }),
    async (req, res) => {
      const user = req.user as any;
      if (user) {
        try {
          await authStorage.createLoginLog({
            userId: user.id,
            userEmail: user.email,
            userName: user.name,
            action: 'login',
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
          });
        } catch (err) {
          console.error('Failed to log login event:', err);
        }
      }
      res.redirect("/");
    }
  );

  app.get("/api/logout", async (req, res) => {
    const user = req.user as any;
    if (user) {
      try {
        await authStorage.createLoginLog({
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          action: 'logout',
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        });
      } catch (err) {
        console.error('Failed to log logout event:', err);
      }
    }
    req.logout(() => {
      res.redirect("/login");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
