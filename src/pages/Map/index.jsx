import React, { useEffect, useState, useRef } from "react";
import { Input, Table, Tree, Tag, Card } from "antd";
import featureData from "./world.zh.json";
import { Scatter } from "@antv/g2plot";
import lemonIcon from "../../assets/icon/icon-lemon.svg";
import { columns } from "./config";
import { tableData, treeData2, chartData2, cardsData } from "./mockData";
import "./style.css";
import {
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
const { Search } = Input;

const Page = () => {
  const scatterPlotRef = useRef(null);
  const fillLayerRef = useRef(null);
  const [dataSource, setDataSource] = useState(tableData);
  const [treeData, setTreeData] = useState(treeData2);
  const [chartData, setChartData] = useState(chartData2);
  const [isDrawerOpens, setIsDrawerOpens] = useState([true, true]);
  const [cardData, setCardData] = useState(cardsData);
  const [selectedProjTags, setSelectedProjTags] = useState([]);
  const [selectedCustTags, setSelectedCustTags] = useState([]);
  const [selectedRangeTags, setSelectedRangeTags] = useState([]);
  const [mousemSelectedData, setMousemSelectedData] = useState('');
  useEffect(() => {
    init();
  }, []);

  // icon: <FileOutlined />,
  // icon: <FolderOpenTwoTone />,

  const init = async () => {
    renderChart();
    renderMap();
  };
  const renderMap = async () => {
    let markedArea = ["泰国", "菲律宾", "老挝", "缅甸", "柬埔寨"];
    featureData.features = featureData.features.filter((feature) =>
      markedArea.includes(feature.properties.name)
    );
    const map = new window.BMapGL.Map("allmap");
    let point = new window.BMapGL.Point(116.414, 39.915);
    map.centerAndZoom(point, 1);
    map.enableScrollWheelZoom(true);
    map.setMapStyleV2({ styleJson: window.whiteStyle });
    if (!fillLayerRef.current) {
      fillLayerRef.current = new window.BMapGL.FillLayer({
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
      const messageDom = document.getElementById("message");

      fillLayerRef.current.addEventListener("mousemove", function (e) {
        const name = e?.value?.dataItem?.properties?.name;
        if (name) {
          messageDom.style.display = "block";
          messageDom.style.top = e.pixel.y + "px";
          messageDom.style.left = e.pixel.x + "px";
          setMousemSelectedData(`区域：${name}`)
          // this.updateState(e.value.dataIndex, { picked: true }, true);
        } else {
          if (messageDom?.style?.display) {
            messageDom.style.display = "none";
          }
        }
      });
    }

    map.addNormalLayer(fillLayerRef.current);
    fillLayerRef.current.setData(featureData);
  };
  const renderChart = () => {
    if (!scatterPlotRef.current) {
      scatterPlotRef.current = new Scatter("chartContainer", {
        // padding: 40,
        data: chartData,
        xField: "year",
        yField: "month",
        size: 8,
        shape: "circle",
        pointStyle: {
          fill: "orange",
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
          formatter: (data) => {
            return data?.name;
          },
          //    style: {
          //   fill: 'red',
          //   opacity: 0.6,
          //   fontSize: 24
          // }
        },
      });
      scatterPlotRef.current.render();
    }
  };
  const handleChange = (tag, checked, type) => {
    if (type === "proj") {
      const nextSelectedTags = checked
        ? [...selectedProjTags, tag]
        : selectedProjTags.filter((t) => t !== tag);
      setSelectedProjTags(nextSelectedTags);
    }
    if (type === "cust") {
      const nextSelectedTags = checked
        ? [...selectedCustTags, tag]
        : selectedCustTags.filter((t) => t !== tag);
      setSelectedCustTags(nextSelectedTags);
    }

    if (type === "range") {
      const nextSelectedTags = checked
        ? [...selectedRangeTags, tag]
        : selectedRangeTags.filter((t) => t !== tag);
      setSelectedRangeTags(nextSelectedTags);
    }
  };
  const onClickonDrawerOpen = (index) => {
    const _isDrawerOpens = [...isDrawerOpens];
    _isDrawerOpens[index] = !_isDrawerOpens[index];
    setIsDrawerOpens(_isDrawerOpens);
    console.log(isDrawerOpens);
  };
  return (
    <div className="page">
      <div id="message" className="message">
        <span>{mousemSelectedData}</span>
      </div>
      <div className="area title">
        <img src={lemonIcon} alt="" />
        地区数据
      </div>
      <div
        className="left"
        style={{ height: isDrawerOpens[0] ? "calc(100% - 44px)" : "16px" }}
      >
        <div className="drawer_icon" onClick={() => onClickonDrawerOpen(0)}>
          {isDrawerOpens[0] ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
        </div>
        <div
          className="cards"
          style={{
            display: isDrawerOpens[0] ? "block" : "none",
            width: "200px",
          }}
        >
          <Card title="项目">
            {cardData[0].map(({ id, name }) => (
              <Tag.CheckableTag
                key={id}
                checked={selectedProjTags.includes(id)}
                onChange={(checked) => handleChange(id, checked, "proj")}
                color="red"
              >
                {name}
              </Tag.CheckableTag>
            ))}
          </Card>
          <Card title="客户" style={{ margin: "12px 0" }}>
            {cardData[1].map(({ id, name }) => (
              <Tag.CheckableTag
                key={id}
                checked={selectedCustTags.includes(id)}
                onChange={(checked) => handleChange(id, checked, "cust")}
                color="red"
              >
                {name}
              </Tag.CheckableTag>
            ))}
          </Card>
          <Card title="发行范围">
            {cardData[2].map(({ id, name }) => (
              <Tag.CheckableTag
                key={id}
                checked={selectedRangeTags.includes(id)}
                onChange={(checked) => handleChange(id, checked, "range")}
                color="red"
              >
                {name}
              </Tag.CheckableTag>
            ))}
          </Card>
        </div>
      </div>
      <div id="allmap" className="map"></div>
      <div className="right">
        <div className="top">
          <p className="title">
            <span
              style={{ display: isDrawerOpens[1] ? "inline-block" : "none" }}
            >
              <img src={lemonIcon} alt="" />
              公司合作情况
            </span>

            <span
              className="drawer_icon"
              onClick={() => onClickonDrawerOpen(1)}
              style={{ float: "right" }}
            >
              {isDrawerOpens[1] ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
          </p>
          <div
            id="chartContainer"
            style={{
              width: "410px",
              height: "320px",
              display: isDrawerOpens[1] ? "block" : "none",
            }}
          />
        </div>
        <div
          className="bottom"
          style={{
            display: isDrawerOpens[1] ? "block" : "none",
          }}
        >
          <p className="title">
            <img src={lemonIcon} alt="" />
            列表数据
          </p>
          <Table
            columns={columns}
            dataSource={dataSource}
            size="small"
            rowKey={"name"}
            pagination={false}
          />
        </div>
      </div>
    </div>
  );
};

export default Page;
