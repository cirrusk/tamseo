export default function TestPage() {
  return (
    <div style={{ padding: 40 }}>
      <h1>TAMSEO TEST PAGE</h1>
      <p>자동배포 검증용 페이지입니다.</p>
      <p>{new Date().toISOString()}</p>
    </div>
  );
}