# EHR Repository Documentation

1. diagrams - Contains plantuml and dbdiagram scripts

## dbdiagrams.io

You can view and export the database schemas at the [dbdiagrams.io](https://dbdiagram.io/) site.

## plantuml

You can view and export plantuml diagrams using:
 1. Plugin for IntelliJ
 2. [Plugin for Chrome Browser](https://chrome.google.com/webstore/detail/plantuml-viewer/legbfeljfbjgfifnkmpoajgpgejojooj?hl=en)
 3. [Plant Text Website](https://www.planttext.com/)
 
The NHS stylesheet for plantuml can be found [HERE](https://gist.github.com/fishey2/c9d9d7c7426d3701959789c10e96fdb0)

The following example is how use the stylesheet in plantuml:

```
@startuml

!include https://gist.githubusercontent.com/fishey2/c9d9d7c7426d3701959789c10e96fdb0/raw/2afa46ecf5e126ad563693a8dccfa3e7ee46a50c/nhs_stylesheet.iuml

@enduml
```