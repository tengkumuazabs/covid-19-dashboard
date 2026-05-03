import { useCallback, useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import PageMeta from "../../components/common/PageMeta";
import useCovidData from "../../hooks/useCovidData";

type CovidDataRow = {
  date: string;
  country: string;
  countryCode: string;
  region: string;
  newCases: number;
  cumulativeCases: number;
  newDeaths: number;
  cumulativeDeaths: number;
};

const countryFlagEmoji = (countryCode: string) =>
  countryCode
    .toUpperCase()
    .replace(/./g, (char) =>
      char >= "A" && char <= "Z"
        ? String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65)
        : ""
    );

type SortField =
  | "country"
  | "newCases"
  | "cumulativeCases"
  | "newDeaths"
  | "cumulativeDeaths";

const ALL_REGIONS = "All regions";
const ALL_COUNTRIES = "All countries";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

const formatDate = (date: string) =>
  date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";

const getSortValue = (row: CovidDataRow, field: SortField) => {
  switch (field) {
    case "country":
      return row.country.toLowerCase();
    case "newCases":
      return row.newCases;
    case "cumulativeCases":
      return row.cumulativeCases;
    case "newDeaths":
      return row.newDeaths;
    case "cumulativeDeaths":
      return row.cumulativeDeaths;
    default:
      return 0;
  }
};

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Home() {
  const rawData = useCovidData();
  const [isLoading, setIsLoading] = useState(true);

  const [selectedRegion, setSelectedRegion] = useState(ALL_REGIONS);
  const [selectedCountry, setSelectedCountry] = useState(ALL_COUNTRIES);
  const [startDate] = useState("");
  const [endDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("cumulativeCases");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  // Debounce search query to avoid excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Pre-process data once when rawData changes
  const processedData = useMemo(() => {
    if (!rawData.length) return { rows: [], regions: new Set<string>(), countries: new Set<string>() };

    const rows: CovidDataRow[] = [];
    const regions = new Set<string>();
    const countries = new Set<string>();

    for (const row of rawData) {
      if (!row.Date_reported || !row.Country) continue;

      const processedRow: CovidDataRow = {
        date: row.Date_reported,
        country: row.Country,
        countryCode: row.Country_code?.toUpperCase() || "",
        region: row.WHO_region || "Other",
        newCases: Number(row.New_cases) || 0,
        cumulativeCases: Number(row.Cumulative_cases) || 0,
        newDeaths: Number(row.New_deaths) || 0,
        cumulativeDeaths: Number(row.Cumulative_deaths) || 0,
      };

      rows.push(processedRow);
      regions.add(processedRow.region);
      countries.add(processedRow.country);
    }

    return { rows, regions, countries };
  }, [rawData]);

  // Update loading state
  useEffect(() => {
    setIsLoading(!processedData.rows.length);
  }, [processedData.rows.length]);

  const regionOptions = useMemo(
    () => [ALL_REGIONS, ...Array.from(processedData.regions).sort()],
    [processedData.regions]
  );

  const countryOptions = useMemo(() => {
    const countries = selectedRegion === ALL_REGIONS
      ? processedData.countries
      : new Set(
          processedData.rows
            .filter((row) => row.region === selectedRegion)
            .map((row) => row.country)
        );

    return [ALL_COUNTRIES, ...Array.from(countries).sort()];
  }, [processedData.rows, processedData.countries, selectedRegion]);

  useEffect(() => {
    if (
      selectedCountry !== ALL_COUNTRIES &&
      !countryOptions.includes(selectedCountry)
    ) {
      setSelectedCountry(ALL_COUNTRIES);
    }
  }, [selectedCountry, countryOptions]);

  // Filter rows efficiently using pre-processed data
  const visibleRows = useMemo(() => {
    let filtered = processedData.rows;

    if (selectedRegion !== ALL_REGIONS) {
      filtered = filtered.filter((row) => row.region === selectedRegion);
    }

    if (selectedCountry !== ALL_COUNTRIES) {
      filtered = filtered.filter((row) => row.country === selectedCountry);
    }

    if (startDate) {
      filtered = filtered.filter((row) => row.date >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter((row) => row.date <= endDate);
    }

    return filtered;
  }, [processedData.rows, selectedRegion, selectedCountry, startDate, endDate]);

  const latestDate = useMemo(
    () =>
      visibleRows.reduce(
        (latest, row) => (row.date > latest ? row.date : latest),
        ""
      ),
    [visibleRows]
  );

  const latestRows = useMemo(
    () => visibleRows.filter((row) => row.date === latestDate),
    [visibleRows, latestDate]
  );

  const totals = useMemo(() => {
    let totalCases = 0;
    let totalDeaths = 0;
    let dailyCases = 0;
    let dailyDeaths = 0;
    let latestNewCases = { value: 0, date: "" };
    let latestNewDeaths = { value: 0, date: "" };

    // Sort visibleRows by date descending to find latest non-zero
    const sortedVisibleRows = [...visibleRows].sort((a, b) => b.date.localeCompare(a.date));

    for (const row of sortedVisibleRows) {
      if (row.newCases > 0 && !latestNewCases.date) {
        latestNewCases = { value: row.newCases, date: row.date };
      }
      if (row.newDeaths > 0 && !latestNewDeaths.date) {
        latestNewDeaths = { value: row.newDeaths, date: row.date };
      }
    }

    for (const row of latestRows) {
      totalCases += row.cumulativeCases;
      totalDeaths += row.cumulativeDeaths;
      dailyCases += row.newCases;
      dailyDeaths += row.newDeaths;
    }

    return { totalCases, totalDeaths, dailyCases, dailyDeaths, latestNewCases, latestNewDeaths };
  }, [visibleRows, latestRows]);

  // Historical trend for full time range with monthly grouping
  const historicalTrend = useMemo(() => {
    // Filter by region and country but not by date range
    let filteredRows = processedData.rows;

    if (selectedRegion !== ALL_REGIONS) {
      filteredRows = filteredRows.filter((row) => row.region === selectedRegion);
    }

    if (selectedCountry !== ALL_COUNTRIES) {
      filteredRows = filteredRows.filter((row) => row.country === selectedCountry);
    }

    const trendMap = new Map<string, { newCases: number; newDeaths: number }>();

    for (const row of filteredRows) {
      const date = new Date(row.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      const existing = trendMap.get(key);
      trendMap.set(key, {
        newCases: (existing?.newCases || 0) + row.newCases,
        newDeaths: (existing?.newDeaths || 0) + row.newDeaths,
      });
    }

    return Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, newCases: data.newCases, newDeaths: data.newDeaths }));
  }, [processedData.rows, selectedRegion, selectedCountry]);

  const regionBreakdown = useMemo(() => {
    const regions = new Map<string, number>();

    for (const row of latestRows) {
      regions.set(row.region, (regions.get(row.region) || 0) + row.cumulativeCases);
    }

    return Array.from(regions.entries()).sort((a, b) => b[1] - a[1]);
  }, [latestRows]);

  const topCountriesByCases = useMemo(
    () => {
      const countryTotals = new Map<string, CovidDataRow>();

      for (const row of latestRows) {
        const existing = countryTotals.get(row.country);
        if (!existing || row.cumulativeCases > existing.cumulativeCases) {
          countryTotals.set(row.country, row);
        }
      }

      return Array.from(countryTotals.values())
        .sort((a, b) => b.cumulativeCases - a.cumulativeCases)
        .slice(0, 10);
    },
    [latestRows]
  );

  const sortedTableRows = useMemo(() => {
    let filtered = latestRows;

    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((row) =>
        row.country.toLowerCase().includes(query)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      const aValue = getSortValue(a, sortField);
      const bValue = getSortValue(b, sortField);

      if (typeof aValue === "string" && typeof bValue === "string") {
        return aValue.localeCompare(bValue);
      }

      return Number(aValue) - Number(bValue);
    });

    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [latestRows, debouncedSearchQuery, sortField, sortDirection]);

  const paginatedTableRows = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedTableRows.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedTableRows, currentPage]);

  const totalPages = Math.ceil(sortedTableRows.length / rowsPerPage);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }, [sortField]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600 mx-auto"></div>
          <p className="text-slate-600">Loading COVID-19 data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="WHO COVID-19 Dashboard | TailAdmin"
        description="Global COVID-19 summary dashboard built from WHO daily data."
      />

      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                WHO COVID-19 dashboard
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Clean COVID-19 trend explorer
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Filter the dataset by region and country to explore the latest reported values and evolving trends.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Region
                <select
                  value={selectedRegion}
                  onChange={(event) => setSelectedRegion(event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  {regionOptions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Country
                <select
                  value={selectedCountry}
                  onChange={(event) => setSelectedCountry(event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  {countryOptions.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">Total Cases</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">
                {formatNumber(totals.totalCases)}
              </p>
              <p className="mt-2 text-sm text-slate-500">Latest cumulative total.</p>
            </div>
            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">Total Deaths</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">
                {formatNumber(totals.totalDeaths)}
              </p>
              <p className="mt-2 text-sm text-slate-500">Latest reported deaths.</p>
            </div>
            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">New Cases</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">
                {formatNumber(totals.latestNewCases.value)}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                As of {formatDate(totals.latestNewCases.date)}.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">New Deaths</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">
                {formatNumber(totals.latestNewDeaths.value)}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                As of {formatDate(totals.latestNewDeaths.date)}.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Cases Over Time</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                New cases and deaths trend
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {selectedCountry !== ALL_COUNTRIES
                  ? selectedCountry
                  : selectedRegion !== ALL_REGIONS
                  ? selectedRegion
                  : "Global"} data across all time periods.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Monthly new cases/deaths
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {historicalTrend.length > 0 ? (
              <>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">New Cases</p>
                  <div className="mt-4">
                    <Chart
                      type="line"
                      width="100%"
                      height={320}
                      series={[
                        {
                          name: "New Cases",
                          data: historicalTrend.map((item) => item.newCases),
                        },
                      ]}
                      options={{
                        chart: {
                          toolbar: { show: false },
                        },
                        legend: { show: false },
                        stroke: { curve: "smooth", width: 3 },
                        dataLabels: { enabled: false },
                        xaxis: {
                          categories: historicalTrend.map((item) => item.date),
                          labels: {
                            rotate: -45,
                            style: { colors: "#64748b" },
                            formatter: (value) => {
                              const [year, month] = String(value).split("-");
                              const months = [
                                "Jan","Feb","Mar","Apr","May","Jun",
                                "Jul","Aug","Sep","Oct","Nov","Dec"
                              ];
                              return `${months[parseInt(month) - 1]} ${year}`;
                            },
                          },
                        },
                        yaxis: {
                          labels: { style: { colors: "#64748b" } },
                        },
                        grid: {
                          borderColor: "#e2e8f0",
                        },
                        colors: ["#2563eb"],
                        tooltip: {
                          y: {
                            formatter: (val) => new Intl.NumberFormat("en-US").format(val),
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">New Deaths</p>
                  <div className="mt-4">
                    <Chart
                      type="line"
                      width="100%"
                      height={320}
                      series={[
                        {
                          name: "New Deaths",
                          data: historicalTrend.map((item) => item.newDeaths),
                        },
                      ]}
                      options={{
                        chart: {
                          toolbar: { show: false },
                        },
                        legend: { show: false },
                        stroke: { curve: "smooth", width: 3 },
                        dataLabels: { enabled: false },
                        xaxis: {
                          categories: historicalTrend.map((item) => item.date),
                          labels: {
                            rotate: -45,
                            style: { colors: "#64748b" },
                            formatter: (value) => {
                              const [year, month] = String(value).split("-");
                              const months = [
                                "Jan","Feb","Mar","Apr","May","Jun",
                                "Jul","Aug","Sep","Oct","Nov","Dec"
                              ];
                              return `${months[parseInt(month) - 1]} ${year}`;
                            },
                          },
                        },
                        yaxis: {
                          labels: { style: { colors: "#64748b" } },
                        },
                        grid: {
                          borderColor: "#e2e8f0",
                        },
                        colors: ["#dc2626"],
                        tooltip: {
                          y: {
                            formatter: (val) => new Intl.NumberFormat("en-US").format(val),
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">No trend data available for the selected filters.</p>
            )}
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">Top 10 countries</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">
                  Cases by country
                </h2>
              </div>
            </div>

            <div className="mt-6">
              <Chart
                type="bar"
                width="100%"
                height={320}
                series={[
                  {
                    name: "Total cases",
                    data: topCountriesByCases.map((row) => row.cumulativeCases),
                  },
                ]}
                options={{
                  chart: { toolbar: { show: false } },
                  plotOptions: { bar: { borderRadius: 10, columnWidth: "55%" } },
                  dataLabels: { enabled: false },
                  xaxis: {
                    categories: topCountriesByCases.map((row) => row.country),
                    labels: { rotate: -45, style: { colors: "#64748b" } },
                  },
                  yaxis: { labels: { style: { colors: "#64748b" } } },
                  grid: { borderColor: "#e2e8f0" },
                  colors: ["#0ea5e9"],
                }}
              />
            </div>

            
          </section>

          <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">Cases by region</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">
                  Region breakdown
                </h2>
              </div>
            </div>

            <div className="mt-6">
              {regionBreakdown.length > 0 ? (
                <Chart
                  type="donut"
                  width="100%"
                  height={320}
                  series={regionBreakdown.map(([, value]) => value)}
                  options={{
                    labels: regionBreakdown.map(([region]) => region),
                    legend: { show: true },
                    dataLabels: {
                      enabled: true,
                      formatter: (value) => new Intl.NumberFormat("en-US").format(Number(value)),
                      style: { colors: ["#64748b"] },
                      dropShadow: { enabled: false },
                    },
                    plotOptions: {
                      pie: {
                        expandOnClick: false,
                      },
                    },
                    states: {
                      hover: {
                        filter: {
                          type: "none",
                        },
                      },
                    },
                    colors: ["#22c55e", "#38bdf8", "#f97316", "#e11d48", "#64748b"],
                  }}
                />
              ) : (
                <p className="text-sm text-slate-500">No region breakdown available yet.</p>
              )}
            </div>
          </section>
        </div>

        {/* <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Map overview</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                Total cases and deaths by country
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Total Cases</p>
              <div className="mt-4 h-[420px]">
                <VectorMap
                  map={worldMill}
                  backgroundColor="transparent"
                  zoomOnScroll={false}
                  regionStyle={{
                    initial: {
                      strokeWidth: 1,
                      stroke: "#fff",
                    },
                  }}
                  series={{
                    regions: [
                      {
                        values: totalCasesMapData,
                        attribute: "fill",
                        scale: ["#dbeafe", "#1d4ed8"],
                        normalizeFunction: "polynomial",
                      },
                    ],
                  }}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Total Deaths</p>
              <div className="mt-4 h-[420px]">
                <VectorMap
                  map={worldMill}
                  backgroundColor="transparent"
                  zoomOnScroll={false}
                  regionStyle={{
                    initial: {
                      strokeWidth: 1,
                      stroke: "#fff",
                    },
                  }}
                  series={{
                    regions: [
                      {
                        values: totalDeathsMapData,
                        attribute: "fill",
                        scale: ["#fee2e2", "#b91c1c"],
                        normalizeFunction: "polynomial",
                      },
                    ],
                  }}
                />
              </div>
            </div>
          </div>
        </section> */}

        <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Country breakdown</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                Latest country-level metrics
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="block text-sm font-medium text-slate-700">
                Search country
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Filter by country name"
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </label>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th
                    className="cursor-pointer px-4 py-3"
                    onClick={() => handleSort("country")}
                  >
                    Country
                  </th>
                  {/* <th
                    className="cursor-pointer px-4 py-3"
                    onClick={() => handleSort("newCases")}
                  >
                    New Cases
                  </th> */}
                  <th
                    className="cursor-pointer px-4 py-3"
                    onClick={() => handleSort("cumulativeCases")}
                  >
                    Total Cases
                  </th>
                  {/* <th
                    className="cursor-pointer px-4 py-3"
                    onClick={() => handleSort("newDeaths")}
                  >
                    New Deaths
                  </th> */}
                  <th
                    className="cursor-pointer px-4 py-3"
                    onClick={() => handleSort("cumulativeDeaths")}
                  >
                    Total Deaths
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTableRows.map((row) => (
                  <tr
                    key={`${row.country}-${row.date}`}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="inline-flex items-center gap-2">
                        {row.countryCode ? (
                          <span className="text-lg">{countryFlagEmoji(row.countryCode)}</span>
                        ) : null}
                        <span>{row.country}</span>
                      </div>
                    </td>
                    {/* <td className="px-4 py-3 text-slate-700">{formatNumber(row.newCases)}</td> */}
                    <td className="px-4 py-3 text-slate-700">{formatNumber(row.cumulativeCases)}</td>
                    {/* <td className="px-4 py-3 text-slate-700">{formatNumber(row.newDeaths)}</td> */}
                    <td className="px-4 py-3 text-slate-700">{formatNumber(row.cumulativeDeaths)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {paginatedTableRows.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{" "}
              {Math.min(currentPage * rowsPerPage, sortedTableRows.length)} of{" "}
              {sortedTableRows.length} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-3xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-3xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
