const display = treeData => {
    // set the dimensions and margins of the diagram
    const width = window.innerWidth * 2;
    const height = window.innerHeight * 3;

    // declares a tree layout and assigns the size
    const treemap = d3.tree()
        .size([height, width])
        .nodeSize([5,300])
        .separation((a,b) => ((a.parent == b.parent) ? 2 : 4))

    //  assigns the data to a hierarchy using parent-child relationships
    let nodes = d3.hierarchy(treeData, d => d.deps)

    // maps the node data to the tree layout
    nodes = treemap(nodes)

    // append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    const svg = d3.select('#root').append('svg')
        .attr('width', width)
        .attr('height', height)
    const g = svg.append('g')
    const circArcsG = svg.append('g')
        .attr('id', 'circ-deps')
    const seenArcsG = svg.append('g')
        .attr('id', 'cross-deps')
        .attr('class', 'disabled')

    // adds the links between the nodes
    const link = g.selectAll('.link')
        .data( nodes.descendants().slice(1))
        .enter().append('path')
        .attr('class', 'link')
        .style('stroke', function(d) { return d.data.level; })
        .attr('d', function(d) {
            return 'M' + d.y + ',' + d.x
                + 'C' + (d.y + d.parent.y) / 2 + ',' + d.x
                + ' ' + (d.y + d.parent.y) / 2 + ',' + d.parent.x
                + ' ' + d.parent.y + ',' + d.parent.x;
        });

    // adds each node as a group
    const node = g.selectAll('.node')
        .data(nodes.descendants())
        .enter().append('g')
    //.attr('data-path', d => d.data.path)
        .attr('data-x', d => d.x)
        .attr('data-y', d => d.y)
        .attr('class', function(d) { 
            return 'node' + 
                (d.children ? ' node--internal' : ' node--leaf'); })
        .attr('transform', function(d) { 
            return 'translate(' + d.y + ',' + d.x + ')'; })
        .on('click', d => window.infoEvents.dispatch('select', d.data))
        .on('mouseenter', d => document.querySelectorAll(`[data-path*="${d.data.path.replace('.js', '')}"]`).forEach(e => e.classList.add('arc--active')))
        .on('mouseleave', d => document.querySelectorAll(`[data-path*="${d.data.path.replace('.js', '')}"]`).forEach(e => e.classList.remove('arc--active')))

    // adds the circle to the node
    const circles = node.append('circle')
        .attr('r', function(d) { return 5; })
        .attr('class', d => `node--type_${d.data.type}`)
        .style('stroke', function(d) { return d.data.type; })
        .style('fill', function(d) { return 'white'; });

    // adds the text to the node
    const text = node.append('text')
        .attr('dy', '.35em')
        .style('text-anchor', function(d) { 
            return d.children ? 'end' : 'start'; })
        .text(function(d) { return d.data.basename || d.data.path; });
        //.attr('x', function(d) { return d.children ? 
        //        (d.data.value + 4) * -1 : d.data.value + 4 })

    const findOriginal = (path, types) => (
        nodes.descendants().filter(d => types.includes(d.data.type) && (d.data.path === path || d.data.path == path + '.js'))[0] || null
    )

    // previously seen files
    const seenArcs = seenArcsG.selectAll('.seenarcs')
        .data(nodes.descendants())
        .enter()
        .filter(d => d.data.type == 'seen')
        .append('path')
        .attr('class', 'seenarc')
        .attr('data-path', d => d.data.path)
        .attr('d', d => {
            let t = findOriginal(d.data.path, ['file', 'error'])
            if (t === null) {
                console.log(`could not find link for ${d.data.path}`)
                return ''
            }
            
            if (t.y != d.y) {
                let bezierPosition = Math.min(d.x, t.x) - 100
                return (
                    'M' + d.y + ',' + d.x + 
                    'C' + (t.y + d.y)/2 + ',' + bezierPosition +
                    ' ' + t.y + ',' + bezierPosition +
                    ' ' + t.y + ',' + t.x
                )
            } else {
                let bezierLead = Math.abs(d.x - t.x) * 0.05
                let bezierOffset = Math.abs(d.x - t.x) / 4
                return (
                    'M' + d.y + ',' + d.x +
                    'C' + (d.y + bezierLead) + ',' + d.x + 
                    ' ' + (t.y + 2*bezierLead) + ',' + t.x + 
                    ' ' + t.y + ',' + t.x
                )
            }
        })
        .on('mouseenter', d => document.querySelectorAll(`[data-path*="${d.data.path.replace('.js', '')}"]`).forEach(e => e.classList.add('arc--active')))
        .on('mouseleave', d => document.querySelectorAll(`[data-path*="${d.data.path.replace('.js', '')}"]`).forEach(e => e.classList.remove('arc--active')))
        
    // circular deps arcs
    const circularArcs = circArcsG.selectAll('.circarcs')
        .data(nodes.descendants())
        .enter()
        .filter(d => d.data.type == 'circular')
        .append('path')
        .attr('class', 'circarc')
        .attr('data-path', d => d.data.path)
        .attr('d', d => {
            let t = findOriginal(d.data.path, ['file', 'error'])
            if (t === null) {
                console.log(`could not find link for ${d.data.path}`)
                return ''
            }
            
            let bezierPosition = Math.min(d.x, t.x) - 100
            return (
                'M' + d.y + ',' + d.x + 
                'C' + (t.y + d.y)/2 + ',' + bezierPosition +
                ' ' + t.y + ',' + bezierPosition +
                ' ' + t.y + ',' + t.x
            )
        })
        
    // create zoom/pan
    const zoom = d3.zoom()
        .on('zoom', () => {
            g.attr('transform', d3.event.transform)
            circArcsG.attr('transform', d3.event.transform)
            seenArcsG.attr('transform', d3.event.transform)
        })
    svg.call(zoom)

}

fetch('./depgraph.json', {cache: 'no-store'})
    .then(r => r.json())
    .then(display)
