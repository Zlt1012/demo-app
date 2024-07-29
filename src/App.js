import "./App.css";
import React, { useEffect, useState } from "react";
import { Input, Table, Tree } from "antd";
import { Chart } from "@antv/g2";
import featureData from './world.zh.json'

import {
  FileOutlined,
  FolderOpenTwoTone,
  DownOutlined,
} from "@ant-design/icons";
const { Search } = Input;

function App() {
  const [dataSource, setDataSource] = useState([]);
  const [treeData, setTreeData] = useState([
    {
      title: "parent 1",
      key: "0-0",
      icon: <FolderOpenTwoTone />,
      children: [
        {
          title: "leaf",
          key: "0-0-0",
          icon: <FileOutlined />,
        },
        {
          title: "leaf",
          key: "0-0-1",
          icon: <FileOutlined />,
        },
      ],
    },
  ]);

  const loadJsonData = async () => {
    console.log(111)
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
      dataIndex: "age",
      key: "age",
    },
    {
      title: "签约时间",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "签约币种",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "单集价格",
      dataIndex: "address",
      key: "address",
    },
  ];

  const renderMap = async () => {

    var markedArea = ['泰国', '菲律宾', '老挝', '缅甸', '柬埔寨',];
    featureData.features = featureData.features.filter(feature => markedArea.includes(feature.properties.name) );

    const map = new window.BMapGL.Map("allmap");
    var point = new window.BMapGL.Point(116.414, 39.915);
    map.centerAndZoom(point, 10);
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
    const chart = new Chart({
      container: "chartContainer",
      autoFit: true,
    });

    const chartData = [
      {
        name: "北京公司",
        month: 5,
        year: 2020,
        color: "red",
      },
      {
        name: "杭州公司",
        month: 7,
        year: 2021,
        color: "red",
      },
      {
        name: "青岛公司",
        month: 12,
        year: 2022,
        color: "red",
      },
      {
        name: "上海公司",
        month: 10,
        year: 2023,
        color: "red",
      },
      {
        name: "郑州公司",
        month: 3,
        year: 2024,
        color: "bule",
      },
    ];

    chart
      .point()
      .data(chartData)
      .encode("x", "year")
      .encode("y", "month")
      .encode("title", "name")
      .axis("y", { title: "" })
      .axis("x", { title: "" })
      .axis("y", false)
      .interaction("tooltip", {
        render: (event, { title, items }) => `<div>
        <h3 style="padding:0;margin:0">${title}</h3>
        </div>`,
      })
      .label({
        text: "name",
        stroke: "#fff",
        textAlign: "start",
        textBaseline: "middle",
        dx: 10,
        position: "left",
        fontSize: 10,
        lineWidth: 2,
      });

    chart.render();
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="page">
          <div className="area title">地区数据</div>
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
              <p className="title">公司合作情况</p>
              <div
                id="chartContainer"
                style={{ width: "440px", height: "400px" }}
              />
            </div>
            <div className="bottom">
              <p className="title">列表数据</p>
              <Table columns={columns} dataSource={dataSource} />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
