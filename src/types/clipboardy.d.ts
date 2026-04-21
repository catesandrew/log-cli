declare module "clipboardy" {
  const clipboardy: {
    write(text: string): Promise<void>;
  };
  export default clipboardy;
}
