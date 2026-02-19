import Kingfisher from './Kingfisher';
import Otter from './Otter';
import Heron from './Heron';
import Turtle from './Turtle';
import Frog from './Frog';
import Crab from './Crab';
import Dragonfly from './Dragonfly';
import Fish from './Fish';
import Mongoose from './Mongoose';
import Butterfly from './Butterfly';

export const illustrations: Record<string, React.FC<{ className?: string }>> = {
  kingfisher: Kingfisher,
  otter: Otter,
  heron: Heron,
  turtle: Turtle,
  frog: Frog,
  crab: Crab,
  dragonfly: Dragonfly,
  fish: Fish,
  mongoose: Mongoose,
  butterfly: Butterfly,
};

export function getIllustration(key: string) {
  return illustrations[key] || null;
}

export {
  Kingfisher,
  Otter,
  Heron,
  Turtle,
  Frog,
  Crab,
  Dragonfly,
  Fish,
  Mongoose,
  Butterfly,
};
