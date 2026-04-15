import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const dashboardCards = [
  {
    title: 'Daily sends',
    value: '0',
    hint: 'Connect inboxes and enroll leads to start sending.',
  },
  {
    title: 'Replies',
    value: '0',
    hint: 'Reply detection events will appear here.',
  },
  {
    title: 'Active sequences',
    value: '0',
    hint: 'Sequence analytics populate after publishing.',
  },
];

export default function DashboardPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-600">
          Desktop-first shell stub ready for leads, sequences, and analytics modules.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {dashboardCards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-3xl">{card.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">{card.hint}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
