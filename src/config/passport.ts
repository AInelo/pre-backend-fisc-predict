import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { findUserById } from '@/mocks/user/user.mock';
import { JwtPayload } from '@/models/user';

const JWT_SECRET = process.env.JWT_SECRET ?? 'fiscpredict-dev-secret';

const options: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET,
};

passport.use(
  new JwtStrategy(options, (payload: JwtPayload, done) => {
    const user = findUserById(payload.sub);
    if (user) {
      return done(null, { id: user.id, username: user.username });
    }
    return done(null, false);
  })
);

export default passport;
