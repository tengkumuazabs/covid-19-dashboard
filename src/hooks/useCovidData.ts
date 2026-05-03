import { useEffect, useState } from "react";

type CovidDataRow = Record<
  | "Date_reported"
  | "Country_code"
  | "Country"
  | "WHO_region"
  | "New_cases"
  | "Cumulative_cases"
  | "New_deaths"
  | "Cumulative_deaths",
  string
>;

function parseCsv(text: string): CovidDataRow[] {
  const rows: CovidDataRow[] = [];
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return rows;
  }

  const parseLine = (line: string) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current);
    return values;
  };

  const headers = parseLine(lines[0]);

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseLine(line);
    if (values.length !== headers.length) continue;

    const row = headers.reduce((acc, header, index) => {
      acc[header as keyof CovidDataRow] = values[index] ?? "";
      return acc;
    }, {} as CovidDataRow);

    rows.push(row);
  }

  return rows;
}

export default function useCovidData() {
  const [data, setData] = useState<CovidDataRow[]>([]);

  useEffect(() => {
    fetch("/data/WHO-COVID-19-global-daily-data.csv")
      .then((res) => res.text())
      .then((text) => {
        setData(parseCsv(text));
      })
      .catch(() => {
        setData([]);
      });
  }, []);

  return data;
}