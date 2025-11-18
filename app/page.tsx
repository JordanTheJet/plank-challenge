import PlankTimer from '@/components/PlankTimer';
import ServiceWorkerProvider from '@/components/ServiceWorkerProvider';

export default function Home() {
  return (
    <>
      <ServiceWorkerProvider />
      <PlankTimer />
    </>
  );
}
