import "./App.css";
import React, { useEffect, useState } from "react";
import { Input, Table, Tree } from "antd";
import { Chart, render } from "@antv/g2";
import featureData from "./world.zh.json";
import { Scatter } from "@antv/g2plot";
import lemonIcon from './icon-lemon.svg'
import {
  FileOutlined,
  FolderOpenTwoTone,
  DownOutlined,
} from "@ant-design/icons";
const { Search } = Input;

function App() {
  let scatterPlot = null
  const [dataSource, setDataSource] = useState([
    {
      name: "上海公司",
      date: "2024-04-01",
      time: "2024-03-01",
      currency: "美元",
      price: "10000",
    },
    {
      name: "郑州公司",
      date: "2024-04-01",
      time: "2024-03-01",
      currency: "美元",
      price: "10000",
    },
    {
      name: "青岛公司",
      date: "2024-04-01",
      time: "2024-03-01",
      currency: "美元",
      price: "10000",
    }, {
      name: "杭州公司",
      date: "2024-04-01",
      time: "2024-03-01",
      currency: "美元",
      price: "10000",
    },
    {
      name: "北京公司",
      date: "2024-04-01",
      time: "2024-03-01",
      currency: "美元",
      price: "10000",
    },
  ]);
  const [treeData, setTreeData] = useState([
    {
      title: "父级",
      key: "0",
      icon: <FolderOpenTwoTone />,
      children: [
        {
          title: "子集1",
          key: "1",
          icon: <FileOutlined />,
        },
        {
          title: "子集2",
          key: "2",
          icon: <FileOutlined />,
        },
        {
          title: "子集3",
          key: "3",
          icon: <FileOutlined />,
        },
      ],
    },
  ]);

  const loadJsonData = async () => {
    console.log(111);
    const response = await fetch("/world.zh.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // 将响应体解析为 JSON
    return await response.json();
  };

  useEffect(() => {
    renderChart();
    renderMap();
  }, []);
  const onSearch = () => {};
  const columns = [
    {
      title: "签约公司",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "国内播出",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "签约时间",
      dataIndex: "time",
      key: "time",
    },
    {
      title: "签约币种",
      dataIndex: "currency",
      key: "currency",
    },
    {
      title: "单集价格",
      dataIndex: "price",
      key: "price",
      render: (v) => (v ? Number(v).toLocaleString() : 0),
    },
  ];

  const renderMap = async () => {
    var markedArea = ["泰国", "菲律宾", "老挝", "缅甸", "柬埔寨"];
    featureData.features = featureData.features.filter((feature) =>
      markedArea.includes(feature.properties.name)
    );

    const map = new window.BMapGL.Map("allmap");
    var point = new window.BMapGL.Point(116.414, 39.915);
    map.centerAndZoom(point, 1);
    map.enableScrollWheelZoom(true);
    map.setMapStyleV2({ styleJson: window.whiteStyle });
    var fillLayer = null;
    if (!fillLayer) {
      fillLayer = new window.BMapGL.FillLayer({
        crs: "GCJ02",
        enablePicked: true,
        autoSelect: true,
        pickWidth: 30,
        pickHeight: 30,
        selectedColor: "green", // 悬浮选中项颜色
        border: true,
        style: {
          fillColor: [
            "case",
            ["boolean", ["feature-state", "picked"], false],
            "red",
            [
              "match",
              ["get", "name"],
              "泰国",
              "#ce4848",
              "菲律宾",
              "blue",
              "老挝",
              "blue",
              "缅甸",
              "#6704ff",
              "柬埔寨",
              "#6704ff",
              "#6704ff", // 明确指定默认值为空
            ],
          ],
          fillOpacity: 0.3,
          strokeWeight: 1,
          strokeColor: "white",
        },
      });

      fillLayer.addEventListener("click", function (e) {
        if (e.value.dataIndex !== -1 && e.value.dataItem) {
          console.log("click", e.value.dataItem);
          // this.updateState(e.value.dataIndex, { picked: true }, true);
        }
      });
    }

    map.addNormalLayer(fillLayer);
    fillLayer.setData(featureData);
  };
  const renderChart = () => {
    const chartData = [
      {
        name: "北京公司",
        month: 5,
        year: 2020,
      },
      {
        name: "杭州公司",
        month: 7,
        year: 2021,
      },
      {
        name: "青岛公司",
        month: 12,
        year: 2022,
      },
      {
        name: "上海公司",
        month: 10,
        year: 2023,
      },
      {
        name: "郑州公司",
        month: 3,
        year: 2024,
      },
    ];
if(!scatterPlot) {
  scatterPlot = new Scatter("chartContainer", {
    // padding: 40,
    data: chartData,
    xField: "year",
    yField: "month",
    size: 8,
    shape: 'circle',
    pointStyle: {
      fill: 'orange',
    },
    tooltip: false,

    // tooltip: {
    //   customContent: (title, data) => {
    //     return data?.[0]?.data?.name;
    //   },
    // },
      yAxis: {
      max: 13,
      label: false,
      },
    xAxis: {
      min: 2019,
      max: 2025,
      grid: {
        line: {
          style: {
            stroke: "#eee",
          },
        },
      },
      line: {
        style: {
          stroke: "#aaa",
        },
      },
    },
    label: {
      formatter: (data)=>{
        return data?.name
      },
    //    style: {
    //   fill: 'red',
    //   opacity: 0.6,
    //   fontSize: 24
    // }
      },
  });
  scatterPlot.render();
}
    
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="page">
          <div className="area title"><img src={lemonIcon} alt="" />地区数据</div>
          <div className="left">
            <Search
              placeholder="请输入关键词"
              onSearch={onSearch}
              style={{ width: 200 }}
            />
            <Tree
              style={{ marginTop: "16px" }}
              showIcon
              defaultExpandAll
              defaultSelectedKeys={["0-0-0"]}
              switcherIcon={<DownOutlined />}
              treeData={treeData}
            />
          </div>
          <div id="allmap" className="map"></div>
          <div className="right">
            <div className="top">
              <p className="title"><img src={lemonIcon} alt="" />公司合作情况</p>
              <div
                id="chartContainer"
                style={{ width: "410px", height: "320px" }}
              />
            </div>
            <div className="bottom">
              <p className="title"><img src={lemonIcon} alt="" />列表数据</p>
              <Table columns={columns} dataSource={dataSource} size="small" pagination={false}/>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
