/**
 * SQL IN 语句生成器工具函数。
 *
 * 将多行文本数据转换为 SQL IN ("val1", "val2", ...) 语句，
 * 支持双引号和单引号两种风格。
 */

/** SQL IN 生成结果 */
export interface SqlInResult {
  /** 生成的 SQL IN 语句 */
  sql: string;
  /** 有效值的数量 */
  count: number;
}

/**
 * 将多行文本转换为 SQL IN 语句。
 *
 * 按行拆分输入，去除首尾空白，跳过空行，
 * 用指定引号包裹每个值后拼接为 IN (...) 格式。
 *
 * @param input 多行文本，每行一个值。
 * @param quote 引号风格，默认双引号。
 * @returns 包含生成语句和值数量的结果对象。
 */
export function generateSqlIn(
  input: string,
  quote: '"' | "'" = '"',
): SqlInResult {
  // 按行拆分，trim 并过滤空行
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { sql: "", count: 0 };
  }

  // 用引号包裹每个值，拼成 IN ("v1", "v2", ...) 格式
  const values = lines.map((line) => `${quote}${line}${quote}`).join(", ");
  return { sql: `IN (${values})`, count: lines.length };
}
