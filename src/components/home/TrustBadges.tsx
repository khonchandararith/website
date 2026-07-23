import { Zap, Shield, HeadphonesIcon } from 'lucide-react';

const badges = [
  {
    icon: Zap,
    title: 'Instant Delivery',
    description: 'Get your license key within seconds after payment',
    color: 'text-blue-400',
    bgColor: 'from-blue-500/10 to-blue-500/5',
    borderColor: 'border-blue-500/20',
  },
  {
    icon: Shield,
    title: '100% Authentic Keys',
    description: 'All keys are genuine and verified for activation',
    color: 'text-green-400',
    bgColor: 'from-green-500/10 to-green-500/5',
    borderColor: 'border-green-500/20',
  },
  {
    icon: HeadphonesIcon,
    title: '24/7 Support',
    description: 'Our team is always ready to help via Telegram',
    color: 'text-purple-400',
    bgColor: 'from-purple-500/10 to-purple-500/5',
    borderColor: 'border-purple-500/20',
  },
];

export function TrustBadges() {
  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className={`glass-card rounded-xl p-6 border ${badge.borderColor}`}
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${badge.bgColor} flex items-center justify-center mb-4`}>
                <badge.icon className={`w-6 h-6 ${badge.color}`} />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                {badge.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
