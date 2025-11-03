interface EventNode {
    id: string;
    data: any;
    nexts: string[];
}

interface FetchedEvent {
    id: string;
    data: any;
    nexts: Array<{
        id: string;
        order: number;
    }>;
}

export class TimelineGraph {
    private nodes: Map<string, EventNode>;

    constructor(fetchedEvents: FetchedEvent[]){
        this.nodes = new Map();
        this.buildFromFetchedEvents(fetchedEvents);
    }

    private buildFromFetchedEvents(fetchedEvents: FetchedEvent[]){
        fetchedEvents.forEach((fetchedEvent) => {
            this.nodes.set(fetchedEvent.id, {
                id: fetchedEvent.id,
                data: fetchedEvent.data,
                nexts: fetchedEvent.nexts
                .sort((a, b) => a.order - b.order)
                .map((next) => next.id),
            })
        })
    }
}
