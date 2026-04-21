for (let index = 0; index < 2000; index += 1) {
  const level = index % 17 === 0 ? "error" : index % 5 === 0 ? "warn" : "info";
  process.stdout.write(
    JSON.stringify({
      timestamp: new Date(1713636000000 + index * 1000).toISOString(),
      level,
      message: `synthetic event ${index}`,
      stream: "stress",
      index,
    }) + "\n",
  );
}
