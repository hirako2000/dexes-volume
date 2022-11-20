const _1 = (md) => {
  return (
    md`
    A visualization of the major DEXes daily volumes, across network. x axis in hundreds of.
    Sunday 20th November 2022.
    `
  )
}

const _toggle = (chart, html) => {
  chart.update(false)
  return html`
    <div class="flex-center">
      <label class="radio" style="font-size:1.5em"><input name="split" type="radio" value="0" checked="true" onclick=${() => chart.update(false)}><small>Global</small></label>
      <label class="radio" style="font-size:1.5em"><input name="split" type="radio" value="1" onclick=${() => chart.update(true)}><small>By Network</small></label>
    </div>
  `
}

const _chart = (d3, width, height, xAxis, data, x, y, r, colour, invalidation, networks, margin, yAxis) => {

  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, width, height]);

  svg.append("g").call(xAxis);
  const yG = svg.append("g").attr("stroke-width", 0);

  const toolTip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("color", "#000")
    .style("background", "#fff")
    .style("opacity", "0.8")
    .style("padding", "0.5em")
    .text("tooltip data");

  const toolTipVolume = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("color", "#000")
    .style("background", "#ffffff")
    .style("opacity", "0.8")
    .style("padding", "0.5em")
    .text("tooltip data");

  let node = svg.append("g")
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.volume24hCap))
    .attr("cy", d => y(d.network) + y.bandwidth() / 1)
    .attr("r", d => r(d.volume24h * d.volume24h / 2000000))
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .attr("fill", d => colour(d.volume24hCap / 2)) // colour(_toRGBRange(d3, d)))// colour(d.volume24hCap /3)) //colour(d.volume24hCap /2))
    .attr("fill", d => "#23201d")
    .attr("opacity", d => Math.max(0.2, d.volume24hCap / 7000000))
    .text(d => d.name)
    .call(d3.drag()
      .on("start", d => {
        if (!d3.event.active) simulation.alpha(1).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", d => {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      })
      .on("end", d => {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;

        d3.selectAll("circle")
      }))
    .on("mouseover", (d) => {
      toolTip.text(d.name + " | " + d.network);
      toolTip.style("visibility", "visible");
      toolTipVolume.text("Volume: $" + numberToUSD(d.volume24h));
      return toolTipVolume.style("visibility", "visible");

    })
    .on("mousemove", () => {
      toolTip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
      return toolTipVolume.style("top", (d3.event.pageY + 25) + "px").style("left", (d3.event.pageX + 10) + "px");

    })
    .on("mouseout", () => {
      toolTip.style("visibility", "hidden");
      return toolTipVolume.style("visibility", "hidden");

    });

  node.append("text")
    .text((d) => {
      return d.name;
    })

  const numberToUSD = (value) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const simulation = d3.forceSimulation()
    .force("x", d3.forceX(d => x(d.volume24hCap)))
    .force("y", d3.forceY(d => y(d.network) + y.bandwidth() / 2))
    .force("collide", d3.forceCollide(d => r(d.volume24h) + 1).strength(0.3));

  simulation.on("tick", () => {
    node
      .transition()
      .delay((d, i) => d.x)
      .ease(d3.easeLinear)
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
  });

  invalidation.then(() => simulation.stop());

  const NETWORKS_HEIGHT = 900;
  const ALL_HEIGHT = 500;
  return Object.assign(svg.node(), {
    update(split) {

      let height = split ? NETWORKS_HEIGHT : ALL_HEIGHT;

      y.domain(split ? networks : networks.concat("Global")); // workaround for updating the yAxis
      y.range(split ? [margin.top, height - margin.bottom] : [height / 2, height / 2]);
      let ticks = split ? networks : ["Global"];

      const t = svg.transition().duration(750);
      svg.transition(t).attr("viewBox", [0, 0, width, height]);
      yG.transition(t).call(yAxis, y, ticks);

      simulation.nodes(data); // update nodes
      simulation.alpha(1).restart(); // restart simulation
    }
  });
}

const _height = () => {
  return (
    400
  )
}

const _margin = () => {
  return (
    { top: 50, right: 100, bottom: 50, left: 200 }
  )
}

const _data = (FileAttachment) => {
  return (
    FileAttachment("data.json").json().then(data => data.map((d, i) => ({ id: i + 1, ...d })))
  )
}

const _networks = (data) => {
  return (
    [...new Set(data.map(d => d.network))]
  )
}

const _x = (d3, data, margin, width) => {
  return (
    d3.scaleLinear()
      .domain(d3.extent(data, d => d.volume24hCap))
      .range([margin.left, width - margin.right])
  )
}


const _y = (d3, networks, height) => {
  return (
    d3.scaleBand()
      .domain(networks)
      .range([height / 2, height / 2])
  )
}

const _xAxis = (margin, d3, x, width) => {
  return (
    g =>
      g
        .attr("transform", `translate(-50, ${margin.top})`)
        .call(d3.axisTop(x).ticks(5))
        .call(g => g.select(".domain").remove())
        .call(g =>
          g
            .append("text")
            .attr("x", width - margin.right)
            .attr("fill", "currentColor")
            .attr("text-anchor", "middle")
            .text("Volume 24h→")
        )
  )
}

const _yAxis = (y, d3) => {
  return (
    (g, scale = y, ticks = y.domain()) =>
      g
        .attr("transform", `translate(${30}, 0)`)
        .call(d3.axisLeft(scale).tickValues(ticks))
        .call(g => g.style("text-anchor", "start"))
        .call(g => g.select(".domain").remove())
  )
}

const _r = (d3, data) => {
  return (
    d3.scaleSqrt()
      .domain(d3.extent(data, d => d.volume24h))
      .range([7, 20])
  )
}

const _colour = (d3, data) => {
  return (
    d3.scaleSequential(d3.extent(data, d => d.volume24hCap), d3.interpolatePlasma)
  )
}

const _d3 = (require) => {
  return (
    require("d3@5")
  )
}

const _html = async (require) => {
  return (
    (await require("htl@0.2")).html
  )
}

export const define = (runtime, observer) => {
  const main = runtime.module();
  const toString = () => { return this.url; }
  const fileAttachments = new Map([
    ["WhatsApp Image 2022-11-04 at 5@2.17.44 PM.jpeg", { url: new URL("./files/80de01c5d1ad01eab05e1988bed1832fabae5e9846ca140bedf74bf7d7f5422d8c09ce7d8dbbd6f0a9fa688608214601c21d3d50e0825f063e4f453411c603ad.jpeg", import.meta.url), mimeType: "image/jpeg", toString }],
    ["color Chart@1.png", { url: new URL("./files/46b1faa55db7da7ac9484f5a02a8c84e8cad40014ad860c03bacc9b302c8ec903d870d4d9861ad29a8ad8dd2118a91bf6991ecbc86904150161040d420658553.png", import.meta.url), mimeType: "image/png", toString }],
    ["data.json", { url: new URL("data.json", import.meta.url), mimeType: "application/json", toString }]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("toggle")).define("toggle", ["chart", "html"], _toggle);
  //main.variable(observer("whatsappImage20221104At521744Pm")).define("whatsappImage20221104At521744Pm", ["FileAttachment"], _whatsappImage20221104At521744Pm);
  //main.variable(observer()).define(["htl"], _4);
  //main.variable(observer()).define(["htl"], _5);
  main.variable(observer("chart")).define("chart", ["d3", "width", "height", "xAxis", "data", "x", "y", "r", "colour", "invalidation", "networks", "margin", "yAxis"], _chart);
  //main.variable(observer()).define(["htl"], _7);
  //main.variable(observer("colorChart1")).define("colorChart1", ["FileAttachment"], _colorChart1);
  //main.variable(observer()).define(["md"], _9);
  main.variable(observer("height")).define("height", _height);
  main.variable(observer("margin")).define("margin", _margin);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  main.variable(observer("networks")).define("networks", ["data"], _networks);
  main.variable(observer("x")).define("x", ["d3", "data", "margin", "width"], _x);
  main.variable(observer("y")).define("y", ["d3", "networks", "height"], _y);
  main.variable(observer("xAxis")).define("xAxis", ["margin", "d3", "x", "width"], _xAxis);
  main.variable(observer("yAxis")).define("yAxis", ["y", "d3"], _yAxis);
  main.variable(observer("r")).define("r", ["d3", "data"], _r);
  main.variable(observer("colour")).define("colour", ["d3", "data"], _colour);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("html")).define("html", ["require"], _html);
  return main;
}
