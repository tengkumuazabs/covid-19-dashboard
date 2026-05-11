import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

export default function BarChartOne() {
  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
      redrawOnParentResize: true,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      tickAmount: 6,
      labels: {
        hideOverlappingLabels: true,
        rotate: -45,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: { width: "100%" },
          xaxis: {
            labels: { rotate: -60, hideOverlappingLabels: true },
            tickAmount: 5,
          },
        },
      },
    ],
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },

    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
  };
  const series = [
    {
      name: "Sales",
      data: [168, 385, 201, 298, 187, 195, 291, 110, 215, 390, 280, 112],
    },
  ];
  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <div id="chartOne" className="w-full min-w-0">
        <Chart options={options} series={series} type="bar" height={180} />
      </div>
    </div>
  );
}
