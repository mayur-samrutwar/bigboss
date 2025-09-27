import CRTMonitor from "../components/CRTMonitor";

export default function Home() {
  const handleEnter = () => {
    console.log("Entering BigBoss system...");
    // Add your logic here for what happens after entering
  };

  return (
    <CRTMonitor onEnter={handleEnter}>
      {/* Content will be handled by CRTMonitor component */}
    </CRTMonitor>
  );
}
